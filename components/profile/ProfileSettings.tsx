"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateLanguage, updateName } from "@/app/[locale]/(dashboard)/profile/actions";

export function ProfileSettings({ initialName }: { initialName: string }) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  const [savingName, startSaveName] = useTransition();
  const [switching, startSwitch] = useTransition();

  const onSave = () => {
    setSaved(false);
    setError(false);
    startSaveName(async () => {
      const res = await updateName(name);
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(true);
      }
    });
  };

  const onSwitch = (next: "en" | "es") => {
    if (next === locale) return;
    startSwitch(async () => {
      await updateLanguage(next);
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <Label htmlFor="fullName" className="text-sm text-muted-foreground">
          {t("nameLabel")}
        </Label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Input
            id="fullName"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            className="h-12 rounded-xl"
          />
          <Button
            type="button"
            onClick={onSave}
            disabled={savingName || name.trim().length === 0}
            className="h-12 px-6"
          >
            {t("save")}
          </Button>
        </div>
        {saved && (
          <p role="status" className="mt-2 text-sm font-medium text-primary">
            {t("saved")}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {t("saveError")}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">{t("languageLabel")}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {routing.locales.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => onSwitch(l)}
                disabled={switching}
                aria-pressed={active}
                className={cn(
                  "flex min-h-[56px] items-center justify-center rounded-xl text-sm font-medium transition disabled:opacity-60",
                  active
                    ? "border-2 border-primary bg-primary/10 text-foreground"
                    : "border border-border text-muted-foreground hover:border-primary/60"
                )}
              >
                {l === "en" ? tc("languageEn") : tc("languageEs")}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
