import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalList, type JournalRow } from "./JournalList";

export default async function JournalPage({
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

  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let entries: JournalRow[] = [];
  if (caseRow) {
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: false });
    entries = (data as JournalRow[] | null) ?? [];
  }

  const t = await getTranslations("journal");

  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-12 pb-28 md:pb-12">
        <header className="space-y-2">
          <h1 className="font-display text-4xl">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="mt-8">
          <JournalEntryForm />
        </div>

        <section className="mt-12">
          <JournalList entries={entries} />
        </section>
      </main>
      <BottomTabBar />
    </>
  );
}
