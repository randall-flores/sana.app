import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function Navbar({ userEmail }: { userEmail?: string }) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl text-primary">
          Sana
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {userEmail ? (
            <>
              <Button asChild size="sm">
                <Link href="/journal">{tn("goToJournal")}</Link>
              </Button>
              <UserMenu email={userEmail} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">{t("signUp")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
