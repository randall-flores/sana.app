"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "hasAttorney" | "attorneyFirmName">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step3Attorney({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step3");
  const options = [
    { id: "yes", label: t("yes") },
    { id: "not_yet", label: t("notYet") },
    { id: "not_sure", label: t("notSure") },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <RadioGroup
        value={value.hasAttorney}
        onValueChange={(v) => onChange({ hasAttorney: v as OnboardingInput["hasAttorney"] })}
        className="grid gap-3"
      >
        {options.map(({ id, label }) => {
          const selected = value.hasAttorney === id;
          return (
            <Label
              key={id}
              htmlFor={`atty-${id}`}
              className={cn(
                "relative flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl p-4 transition",
                selected
                  ? "border-2 border-primary bg-primary/10"
                  : "border border-border shadow-sm hover:border-primary/60"
              )}
            >
              <RadioGroupItem id={`atty-${id}`} value={id} className="sr-only" />
              <span className="text-sm font-medium">{label}</span>
              {selected && (
                <span className="absolute top-1/2 right-3 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </Label>
          );
        })}
      </RadioGroup>

      {value.hasAttorney === "yes" && (
        <div className="space-y-2">
          <Label htmlFor="attorneyFirmName">{t("firmLabel")}</Label>
          <Input
            id="attorneyFirmName"
            value={value.attorneyFirmName}
            onChange={(e) => onChange({ attorneyFirmName: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
