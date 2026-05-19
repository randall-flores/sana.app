"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
        {options.map(({ id, label }) => (
          <Label
            key={id}
            htmlFor={`atty-${id}`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-4 transition hover:border-primary/60 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
          >
            <RadioGroupItem id={`atty-${id}`} value={id} className="sr-only" />
            <span className="text-sm">{label}</span>
          </Label>
        ))}
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
