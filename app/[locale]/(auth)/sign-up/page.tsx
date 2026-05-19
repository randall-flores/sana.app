"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md items-center px-6 py-12">
      <Card className="w-full rounded-xl border-border/70 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{t("signUpTitle")}</CardTitle>
          <CardDescription>{t("signUpSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">{t("preferredLanguage")}</Label>
              <Select name="preferredLanguage" defaultValue={locale}>
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{tc("languageEn")}</SelectItem>
                  <SelectItem value="es">{tc("languageEs")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {t("errorGeneric")}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {t("submitSignUp")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
                {t("submitSignIn")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
