import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BottomTabBar } from "@/components/BottomTabBar";
import { JournalEntryForm } from "./JournalEntryForm";
import { JournalList, type JournalRow } from "./JournalList";
import { JournalSelectionProvider } from "./JournalSelectionProvider";
import { JournalHeaderActions } from "./JournalHeaderActions";
import { SelectBar } from "./SelectBar";

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
    <JournalSelectionProvider>
      <main className="mx-auto max-w-2xl px-6 py-12 pb-28 md:pb-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
            <p className="text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
          </div>
          <JournalHeaderActions />
        </header>

        <div className="mt-8">
          <JournalEntryForm />
        </div>

        <section className="mt-12">
          <JournalList entries={entries} />
        </section>
      </main>
      <SelectBar />
      <BottomTabBar />
    </JournalSelectionProvider>
  );
}
