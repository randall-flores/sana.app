import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import { AppointmentList, type Appointment } from "./AppointmentList";

export default async function AppointmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/sign-in", locale: locale as "en" | "es" });
    return null;
  }

  // Single-case model: resolve the user's case automatically (mirrors Journal).
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let appointments: Appointment[] = [];
  if (caseRow) {
    const { data } = await supabase
      .from("appointments")
      .select("id, title, appt_at, appt_type, location, notes")
      .eq("case_id", caseRow.id)
      .order("appt_at", { ascending: true });
    appointments = (data as Appointment[] | null) ?? [];
  }

  const t = await getTranslations("appointments");

  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-12 pb-28 md:pb-12">
        <header className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        </header>

        <div className="mt-8">
          {caseRow ? (
            <AppointmentList appointments={appointments} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noCase")}</p>
          )}
        </div>
      </main>
      <BottomTabBar />
    </>
  );
}
