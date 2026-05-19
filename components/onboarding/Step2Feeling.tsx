"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "painLevel" | "notes">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step2Feeling({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step2");
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="painLevel">{t("painLabel")}</Label>
          <span className="font-display text-2xl text-primary">{value.painLevel}</span>
        </div>
        <Slider
          id="painLevel"
          min={1}
          max={10}
          step={1}
          value={[value.painLevel]}
          onValueChange={(values) => {
            const n = values[0];
            if (n !== undefined) onChange({ painLevel: n });
          }}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder={t("notesPlaceholder")}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
