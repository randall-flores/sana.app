"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "painLevel" | "notes">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step2Feeling({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step2");
  const pain = value.painLevel;
  const sev =
    pain <= 3
      ? {
          text: "text-primary",
          range: "[&_[data-slot=slider-range]]:bg-primary",
          thumb: "[&_[data-slot=slider-thumb]]:border-primary",
        }
      : pain <= 6
        ? {
            text: "text-pain-mid",
            range: "[&_[data-slot=slider-range]]:bg-pain-mid",
            thumb: "[&_[data-slot=slider-thumb]]:border-pain-mid",
          }
        : {
            text: "text-pain-high",
            range: "[&_[data-slot=slider-range]]:bg-pain-high",
            thumb: "[&_[data-slot=slider-thumb]]:border-pain-high",
          };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm text-muted-foreground">{t("painLabel")}</span>
          <span
            className={cn("font-display text-[64px] font-bold leading-none", sev.text)}
            aria-live="polite"
          >
            {pain}
          </span>
        </div>

        <Slider
          id="painLevel"
          min={1}
          max={10}
          step={1}
          value={[pain]}
          onValueChange={(values) => {
            const n = values[0];
            if (n !== undefined) onChange({ painLevel: n });
          }}
          className={cn("mt-6", sev.range, sev.thumb)}
        />

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              1
            </span>
            <span>{t("noPain")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{t("severePain")}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              10
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder={t("notesPlaceholder")}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="rounded-xl"
        />
      </div>
    </div>
  );
}
