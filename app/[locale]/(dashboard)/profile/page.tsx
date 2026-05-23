import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/[locale]/(auth)/actions";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { BottomTabBar } from "@/components/BottomTabBar";
import { Button } from "@/components/ui/button";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium sm:text-right">{value}</dd>
    </div>
  );
}

export default async function ProfilePage({
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
    .select("full_name, preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  const { data: caseRow } = await supabase
    .from("cases")
    .select("accident_date, accident_type, accident_description, has_attorney, attorney_firm_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const fullName = profile?.full_name ?? "";

  const accidentDate = caseRow
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
        new Date(`${caseRow.accident_date}T00:00:00`),
      )
    : null;

  return (
    <>
      <main className="mx-auto max-w-xl space-y-8 px-6 py-12 pb-28 md:pb-12">
        <h1 className="font-display text-4xl">{t("title")}</h1>

        <ProfileSettings initialName={fullName} />

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold">{t("accidentTitle")}</h2>
          {caseRow ? (
            <dl className="mt-4 space-y-3 text-sm">
              <InfoRow label={t("accidentDate")} value={accidentDate!} />
              <InfoRow label={t("accidentType")} value={t(`type.${caseRow.accident_type}`)} />
              {caseRow.accident_description ? (
                <InfoRow label={t("accidentDescription")} value={caseRow.accident_description} />
              ) : null}
              <InfoRow label={t("attorneyStatus")} value={t(`attorney.${caseRow.has_attorney}`)} />
              {caseRow.has_attorney === "yes" && caseRow.attorney_firm_name ? (
                <InfoRow label={t("attorneyFirm")} value={caseRow.attorney_firm_name} />
              ) : null}
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{t("noAccident")}</p>
          )}
        </section>

        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-12 w-full">
            {tc("signOut")}
          </Button>
        </form>
      </main>
      <BottomTabBar />
    </>
  );
}
