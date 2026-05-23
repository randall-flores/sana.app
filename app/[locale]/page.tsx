import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { FileText, HeartPulse, Scale, ArrowRight } from "lucide-react";
import { Link, redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Logged-in users skip the marketing page and go straight into the app.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect({ href: "/dashboard", locale: locale as "en" | "es" });
  }

  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations("landing");
  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
              <Link href="/sign-up">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<FileText className="h-5 w-5 text-primary" />}
            title={t("features.documentTitle")}
            body={t("features.documentBody")}
          />
          <FeatureCard
            icon={<HeartPulse className="h-5 w-5 text-primary" />}
            title={t("features.recoveryTitle")}
            body={t("features.recoveryBody")}
          />
          <FeatureCard
            icon={<Scale className="h-5 w-5 text-primary" />}
            title={t("features.caseTitle")}
            body={t("features.caseBody")}
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-xl border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="rounded-lg bg-primary/10 p-2">{icon}</span>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
    </Card>
  );
}
