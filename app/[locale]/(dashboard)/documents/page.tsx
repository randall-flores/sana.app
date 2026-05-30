import { setRequestLocale, getTranslations } from "next-intl/server";
import { FolderOpen } from "lucide-react";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentList, type DocumentRow } from "./DocumentList";

export default async function DocumentsPage({
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

  let docs: DocumentRow[] = [];
  if (caseRow) {
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, mime_type, file_size, storage_path, created_at")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: false });
    docs = (data as DocumentRow[] | null) ?? [];
  }

  const t = await getTranslations("documents");

  return (
    <>
      <main className="mx-auto max-w-2xl px-6 py-12 pb-28 md:pb-12">
        <header className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
          <p className="text-base text-muted-foreground sm:text-lg">{t("subtitle")}</p>
        </header>

        <div className="mt-8">
          {caseRow ? (
            <DocumentUpload userId={user.id} caseId={caseRow.id} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noCase")}</p>
          )}
        </div>

        <section className="mt-10">
          {docs.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-border/70 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="rounded-2xl bg-primary/10 p-3">
                  <FolderOpen className="h-6 w-6 text-primary" aria-hidden />
                </span>
                <p className="max-w-xs text-balance text-muted-foreground">{t("empty")}</p>
              </CardContent>
            </Card>
          ) : (
            <DocumentList docs={docs} />
          )}
        </section>
      </main>
      <BottomTabBar />
    </>
  );
}
