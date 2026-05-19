"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { signIn, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md items-center px-6 py-12">
      <Card className="w-full rounded-xl border-border/70 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{t("signInTitle")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" minLength={8} />
            </div>
            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error === "invalid_credentials" ? t("errorInvalidCredentials") : t("errorGeneric")}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {t("submitSignIn")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                {t("submitSignUp")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
