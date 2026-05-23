"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { painSeverity, painSliderClasses } from "@/lib/pain";
import { createJournalEntry } from "./actions";
import {
  journalEntrySchema,
  type JournalEntryInput,
  type PainLocation,
  type PainQuality,
  type Mood,
  PAIN_LOCATIONS,
  PAIN_QUALITIES,
  MOODS,
} from "@/lib/validation/journal";

const DEFAULTS: JournalEntryInput = {
  painLevel: 5,
  notes: "",
  painLocations: [],
  painQuality: [],
  dailyImpact: "",
  mood: undefined,
  medications: "",
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[56px] items-center justify-center rounded-xl px-4 text-center text-sm font-medium transition",
        selected
          ? "border-2 border-primary bg-primary/10 text-foreground"
          : "border border-border text-muted-foreground hover:border-primary/60"
      )}
    >
      {children}
    </button>
  );
}

export function JournalEntryForm() {
  const t = useTranslations("journal");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset } = useForm<JournalEntryInput>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: DEFAULTS,
  });

  const painLevel = watch("painLevel");
  const locations = watch("painLocations") ?? [];
  const quality = watch("painQuality") ?? [];
  const mood = watch("mood");
  const sev = painSliderClasses[painSeverity(painLevel)];

  const toggleLocation = (loc: PainLocation) =>
    setValue(
      "painLocations",
      locations.includes(loc) ? locations.filter((l) => l !== loc) : [...locations, loc],
      { shouldValidate: true }
    );

  const toggleQuality = (q: PainQuality) =>
    setValue(
      "painQuality",
      quality.includes(q) ? quality.filter((v) => v !== q) : [...quality, q],
      { shouldValidate: true }
    );

  const selectMood = (m: Mood) =>
    setValue("mood", mood === m ? undefined : m, { shouldValidate: true });

  const onValid = (values: JournalEntryInput) => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await createJournalEntry(values);
      if (res.ok) {
        reset(DEFAULTS);
        setOpen(false);
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error === "no_case" ? t("errorNoCase") : t("error"));
      }
    });
  };

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit(onValid)} className="space-y-8">
          {/* ---- Fast core (always visible) ---- */}
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-muted-foreground">{t("painLabel")}</span>
              <span
                className={cn("font-display text-[64px] font-bold leading-none", sev.text)}
                aria-live="polite"
              >
                {painLevel}
              </span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[painLevel]}
              onValueChange={(v) => {
                if (v[0] !== undefined) setValue("painLevel", v[0], { shouldValidate: true });
              }}
              aria-label={t("painLabel")}
              className={cn("px-2", sev.range, sev.thumb)}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("noPain")}</span>
              <span>{t("severePain")}</span>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">{t("locationsLabel")}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PAIN_LOCATIONS.map((loc) => (
                <Chip
                  key={loc}
                  selected={locations.includes(loc)}
                  onClick={() => toggleLocation(loc)}
                >
                  {t(`locations.${loc}`)}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("notesLabel")}</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder={t("notesPlaceholder")}
              className="rounded-xl"
              {...register("notes")}
            />
          </div>

          {/* ---- Optional detail (collapsed by default) ---- */}
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-14 w-full justify-between px-5 text-base"
              >
                <span>{t("moreToggle")}</span>
                <ChevronDown
                  className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-8 pt-6">
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{t("qualityLabel")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAIN_QUALITIES.map((q) => (
                    <Chip
                      key={q}
                      selected={quality.includes(q)}
                      onClick={() => toggleQuality(q)}
                    >
                      {t(`quality.${q}`)}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="dailyImpact">{t("impactLabel")}</Label>
                <Textarea
                  id="dailyImpact"
                  rows={3}
                  placeholder={t("impactPlaceholder")}
                  className="rounded-xl"
                  {...register("dailyImpact")}
                />
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">{t("moodLabel")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MOODS.map((m) => (
                    <Chip key={m} selected={mood === m} onClick={() => selectMood(m)}>
                      {t(`mood.${m}`)}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="medications">{t("medicationsLabel")}</Label>
                <Input
                  id="medications"
                  placeholder={t("medicationsPlaceholder")}
                  className="h-12 rounded-xl"
                  {...register("medications")}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {saved && (
            <p role="status" className="text-sm font-medium text-primary">
              {t("saved")}
            </p>
          )}

          <Button type="submit" disabled={pending} className="h-[60px] w-full text-base">
            {pending ? t("saving") : t("save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
