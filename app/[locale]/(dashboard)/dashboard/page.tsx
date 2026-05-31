import { setRequestLocale, getTranslations } from "next-intl/server";
import { FileText, NotebookPen, Scale } from "lucide-react";
import { Link, redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomTabBar } from "@/components/BottomTabBar";
import { cn } from "@/lib/utils";
import { RecoverySummaryCard, type SummaryData } from "./RecoverySummaryCard";
import { NextAppointmentCard, type NextAppointment } from "./NextAppointmentCard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/sign-in", locale: locale as "en" | "es" });
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // Recovery-summary state: entry count gates the card; the stored summary (if
  // any) renders immediately so we don't call the model on every dashboard view.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let entryCount = 0;
  let summary: SummaryData | null = null;
  let nextAppt: NextAppointment | null = null;
  if (caseRow) {
    const { count } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("case_id", caseRow.id);
    entryCount = count ?? 0;

    const { data: summaryRow } = await supabase
      .from("case_summaries")
      .select("summary_text, language, entry_count_at_generation, generated_at")
      .eq("case_id", caseRow.id)
      .maybeSingle();
    summary = (summaryRow as SummaryData | null) ?? null;

    // Single nearest upcoming appointment. UTC instant comparison (gte now) is
    // timezone-independent; the friendly label is rendered client-side.
    const { data: apptRow } = await supabase
      .from("appointments")
      .select("id, title, appt_at, appt_type")
      .eq("case_id", caseRow.id)
      .gte("appt_at", new Date().toISOString())
      .order("appt_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    nextAppt = (apptRow as NextAppointment | null) ?? null;
  }

  const t = await getTranslations("dashboard");
  const firstName = (profile?.full_name ?? "").split(" ")[0] ?? "";

  const cards = [
    { icon: NotebookPen, title: t("journalTitle"), href: "/journal" as const, cta: t("journalCta") },
    { icon: FileText, title: t("documentsTitle"), href: "/documents" as const, cta: t("documentsCta") },
    { icon: Scale, title: t("caseTitle"), href: null, cta: t("comingSoon") },
  ];

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-12 pb-28 md:pb-12">
        <header>
          <h1 className="font-display text-4xl">{t("greetingName", { firstName })}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("greetingQuestion")}</p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map(({ icon: Icon, title, href, cta }) => {
            // No href = not built yet (e.g. Case Status). Render inert + muted
            // with a "Coming soon" badge — visible placeholder, no navigation.
            const card = (
              <Card
                className={cn(
                  "h-full min-h-[160px] justify-between rounded-2xl border-border/70 shadow-sm",
                  href ? "transition-shadow hover:shadow-md" : "opacity-70"
                )}
              >
                <CardHeader className="flex flex-col items-start gap-3 space-y-0">
                  <span className={cn("rounded-2xl p-3", href ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("h-6 w-6", href ? "text-primary" : "text-muted-foreground")} />
                  </span>
                  <CardTitle className="font-display text-lg font-semibold">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {href ? (
                    <span className="text-sm font-medium text-primary">{cta}</span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {cta}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
            return href ? (
              <Link key={title} href={href} className="block">
                {card}
              </Link>
            ) : (
              // Inert: aria-disabled signals not-available to assistive tech.
              <div key={title} aria-disabled="true">
                {card}
              </div>
            );
          })}
        </div>

        {caseRow && <NextAppointmentCard next={nextAppt} />}

        {caseRow && (
          <RecoverySummaryCard initialSummary={summary} entryCount={entryCount} />
        )}
      </main>
      <BottomTabBar />
    </>
  );
}
