"use client";

import { useTranslations } from "next-intl";
import { Car, Footprints, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "accidentDate" | "accidentType" | "accidentDescription">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step1Accident({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step1");
  const options = [
    { id: "car", label: t("typeCar"), icon: Car },
    { id: "slip", label: t("typeSlip"), icon: Footprints },
    { id: "other", label: t("typeOther"), icon: HelpCircle },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <div className="space-y-2">
        <Label htmlFor="accidentDate">{t("dateLabel")}</Label>
        <Input
          id="accidentDate"
          type="date"
          required
          value={value.accidentDate}
          onChange={(e) => onChange({ accidentDate: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>{t("typeLabel")}</Label>
        <RadioGroup
          value={value.accidentType}
          onValueChange={(v) => onChange({ accidentType: v as OnboardingInput["accidentType"] })}
          className="grid gap-3 sm:grid-cols-3"
        >
          {options.map(({ id, label, icon: Icon }) => (
            <Label
              key={id}
              htmlFor={`type-${id}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-4 transition hover:border-primary/60 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
            >
              <RadioGroupItem id={`type-${id}`} value={id} className="sr-only" />
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm">{label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accidentDescription">{t("descriptionLabel")}</Label>
        <Textarea
          id="accidentDescription"
          rows={3}
          value={value.accidentDescription}
          onChange={(e) => onChange({ accidentDescription: e.target.value })}
        />
      </div>
    </div>
  );
}
