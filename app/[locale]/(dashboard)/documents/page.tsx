import { setRequestLocale, getTranslations } from "next-intl/server";
import { FileText, Image as ImageIcon } from "lucide-react";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BottomTabBar } from "@/components/BottomTabBar";
import { DocumentUpload } from "./DocumentUpload";

type DocRow = {
  id: string;
  file_name: string;
  mime_type: string;
  created_at: string;
};

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

  let docs: DocRow[] = [];
  if (caseRow) {
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, mime_type, created_at")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: false });
    docs = (data as DocRow[] | null) ?? [];
  }

  const t = await getTranslations("documents");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

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
              <CardContent className="p-8 text-center text-muted-foreground">
                {t("empty")}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-3">
              {docs.map((d) => {
                const Icon = d.mime_type === "application/pdf" ? FileText : ImageIcon;
                return (
                  <li key={d.id}>
                    <Card className="rounded-2xl border-border/70 shadow-sm">
                      <CardContent className="flex items-center gap-3 p-4">
                        <span className="shrink-0 rounded-xl bg-primary/10 p-2.5">
                          <Icon className="h-5 w-5 text-primary" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {d.file_name}
                          </p>
                          <time className="text-xs text-muted-foreground">
                            {dateFmt.format(new Date(d.created_at))}
                          </time>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <BottomTabBar />
    </>
  );
}
