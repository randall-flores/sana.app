import { setRequestLocale, getTranslations } from "next-intl/server";
import { FileText, NotebookPen, Scale } from "lucide-react";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomTabBar } from "@/components/BottomTabBar";

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

  const t = await getTranslations("dashboard");
  const firstName = (profile?.full_name ?? "").split(" ")[0] ?? "";

  const placeholders = [
    { icon: NotebookPen, title: t("journalTitle") },
    { icon: FileText, title: t("documentsTitle") },
    { icon: Scale, title: t("caseTitle") },
  ];

  return (
    <>
      <main className="mx-auto max-w-5xl px-6 py-12 pb-28 md:pb-12">
        <header>
          <h1 className="font-display text-4xl">{t("greetingName", { firstName })}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("greetingQuestion")}</p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {placeholders.map(({ icon: Icon, title }) => (
            <Card
              key={title}
              className="min-h-[160px] justify-between rounded-2xl border-border/70 shadow-sm"
            >
              <CardHeader className="flex flex-col items-start gap-3 space-y-0">
                <span className="rounded-2xl bg-primary/10 p-3">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <CardTitle className="font-display text-lg font-semibold">{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{t("comingSoon")}</CardContent>
            </Card>
          ))}
        </div>
      </main>
      <BottomTabBar />
    </>
  );
}
