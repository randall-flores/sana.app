"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Step1Accident } from "./Step1Accident";
import { Step2Feeling } from "./Step2Feeling";
import { Step3Attorney } from "./Step3Attorney";
import { saveOnboarding } from "@/app/[locale]/(dashboard)/onboarding/actions";
import type { OnboardingInput } from "@/lib/validation/onboarding";

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingInput>({
    accidentDate: "",
    accidentType: "car",
    accidentDescription: "",
    painLevel: 5,
    notes: "",
    hasAttorney: "not_sure",
    attorneyFirmName: "",
  });

  const patch = (p: Partial<OnboardingInput>) => setData((d) => ({ ...d, ...p }));

  const onNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const onBack = () => setStep((s) => Math.max(s - 1, 1));
  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveOnboarding(data);
      if (result && result.ok === false) setError(result.error);
    });
  };

  const canAdvance =
    (step === 1 && data.accidentDate && data.accidentType) ||
    (step === 2 && data.painLevel >= 1 && data.painLevel <= 10) ||
    step === 3;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Card className="rounded-xl border-border/70 shadow-sm">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("step", { current: step, total: TOTAL_STEPS })}
            </p>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && <Step1Accident value={data} onChange={patch} />}
          {step === 2 && <Step2Feeling value={data} onChange={patch} />}
          {step === 3 && <Step3Attorney value={data} onChange={patch} />}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={step === 1 || pending}
              className="h-[60px] flex-1 px-6"
            >
              {tc("back")}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={!canAdvance || pending}
                className="h-[60px] flex-1 px-6"
              >
                {tc("continue")}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={pending}
                className="h-[60px] flex-1 px-6"
              >
                {t("submit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
