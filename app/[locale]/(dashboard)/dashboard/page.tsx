import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookOpen, FolderOpen, Scale } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();

  const t = await getTranslations("dashboard");
  const firstName = (profile?.full_name ?? "").split(" ")[0] ?? "";

  const placeholders = [
    { icon: BookOpen, title: t("journalTitle") },
    { icon: FolderOpen, title: t("documentsTitle") },
    { icon: Scale, title: t("caseTitle") },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl">{t("greeting", { firstName })}</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {placeholders.map(({ icon: Icon, title }) => (
          <Card key={title} className="rounded-xl border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <span className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <CardTitle className="font-display text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("comingSoon")}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
