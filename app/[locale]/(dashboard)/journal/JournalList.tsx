"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { painBadgeClasses, painSeverity } from "@/lib/pain";
import { labelFor, REGION_LABELS } from "@/components/journal/BodyPainMap";
import { useJournalSelection } from "./JournalSelectionProvider";

export type JournalRow = {
  id: string;
  created_at: string;
  pain_level: number;
  notes: string | null;
  pain_locations: string[] | null;
  pain_quality: string[] | null;
  daily_impact: string | null;
  mood: string[] | null;
  medications: string | null;
};

// Calendar-day key in the *viewer's* local timezone (component is client-only).
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function EntryCard({
  entry,
  timeFmt,
}: {
  entry: JournalRow;
  timeFmt: Intl.DateTimeFormat;
}) {
  const t = useTranslations("journal");
  const [open, setOpen] = useState(false);

  const { selectionMode, isSelected, toggle } = useJournalSelection();
  const sev = painSeverity(entry.pain_level);
  const locale = useLocale() as "en" | "es";
  const moods = entry.mood ?? [];
  const hasQuality = !!entry.pain_quality && entry.pain_quality.length > 0;
  const hasImpact = !!entry.daily_impact && entry.daily_impact.trim().length > 0;
  const hasMood = moods.length > 0;
  const hasMeds = !!entry.medications && entry.medications.trim().length > 0;
  const hasDetail = hasQuality || hasImpact || hasMood || hasMeds;
  const selected = isSelected(entry.id);

  // Localized area labels (hybrid: body-map keys → labelFor, legacy → messages).
  const areaLabels = (entry.pain_locations ?? []).map((loc) =>
    loc in REGION_LABELS ? labelFor(loc, locale) : t(`locations.${loc}`)
  );
  const moodText = moods.map((m) => t(`mood.${m}`)).join(", ");
  // Mood (translated) + notes (verbatim, never translated).
  const secondLine = [moodText, entry.notes?.trim()].filter(Boolean).join(" — ");

  // Dense single-row summary, shared by normal + selection modes.
  const compact = (
    <>
      <span
        aria-label={t("painBadge", { level: entry.pain_level })}
        className={cn(
          "flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-full px-2 text-sm font-semibold tabular-nums",
          painBadgeClasses[sev]
        )}
      >
        {entry.pain_level}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          {areaLabels.length > 0 ? (
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {areaLabels.join(" · ")}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-sm italic text-muted-foreground">
              {t("list.noAreas")}
            </span>
          )}
          <time className="shrink-0 text-xs text-muted-foreground">
            {timeFmt.format(new Date(entry.created_at))}
          </time>
        </div>
        {secondLine && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{secondLine}</p>
        )}
      </div>
    </>
  );

  // Selection mode: the whole card is a checkbox; tapping toggles (no expand).
  if (selectionMode) {
    return (
      <Card
        role="checkbox"
        aria-checked={selected}
        aria-label={t("painBadge", { level: entry.pain_level })}
        tabIndex={0}
        onClick={() => toggle(entry.id)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            toggle(entry.id);
          }
        }}
        className={cn(
          "relative cursor-pointer rounded-2xl shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
          selected
            ? "border-2 border-primary bg-primary/5"
            : "border border-border/70 hover:border-primary/50"
        )}
      >
        <CardContent className="min-h-[56px] p-5 pr-14">
          <span
            aria-hidden
            className={cn(
              "absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
            )}
          >
            {selected && <Check className="h-4 w-4" />}
          </span>
          <div className="flex items-start gap-3">{compact}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <Collapsible open={open} onOpenChange={setOpen}>
        {hasDetail ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-[56px] w-full items-start gap-3 rounded-2xl p-4 text-left transition hover:bg-muted/40"
            >
              {compact}
              <ChevronDown
                className={cn(
                  "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <div className="flex min-h-[56px] items-start gap-3 p-4">{compact}</div>
        )}

        <CollapsibleContent className="space-y-4 px-4 pb-4">
          {hasQuality && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">{t("detail.quality")}</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.pain_quality!.map((q) => (
                  <span
                    key={q}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {t(`quality.${q}`)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasImpact && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">{t("detail.impact")}</p>
              <p className="text-sm text-foreground/90">{entry.daily_impact}</p>
            </div>
          )}

          {hasMood && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">{t("detail.mood")}</p>
              <p className="text-sm text-foreground/90">
                {moods.map((m) => t(`mood.${m}`)).join(", ")}
              </p>
            </div>
          )}

          {hasMeds && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                {t("detail.medications")}
              </p>
              <p className="text-sm text-foreground/90">{entry.medications}</p>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function JournalList({ entries }: { entries: JournalRow[] }) {
  const t = useTranslations("journal");
  const locale = useLocale();

  // Date grouping depends on the browser timezone, which the server doesn't
  // know — render only on the client so SSR and client agree (no hydration drift).
  // useSyncExternalStore returns false during SSR, true after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const view = useMemo(() => {
    const groups = new Map<string, JournalRow[]>();
    for (const e of entries) {
      const key = dayKey(new Date(e.created_at));
      const bucket = groups.get(key);
      if (bucket) bucket.push(e);
      else groups.set(key, [e]);
    }
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return {
      groups,
      todayKey: dayKey(now),
      yesterdayKey: dayKey(yesterday),
      dateFmt: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
      timeFmt: new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }),
    };
  }, [entries, locale]);

  if (!mounted) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/40" aria-hidden />;
  }

  if (entries.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-border/70 bg-transparent shadow-none">
        <CardContent className="p-8 text-center text-muted-foreground">{t("empty")}</CardContent>
      </Card>
    );
  }

  const headingFor = (key: string, sample: Date) => {
    if (key === view.todayKey) return t("today");
    if (key === view.yesterdayKey) return t("yesterday");
    return view.dateFmt.format(sample);
  };

  return (
    <div className="space-y-8">
      {Array.from(view.groups.entries()).map(([key, dayEntries]) => (
        <div key={key} className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {headingFor(key, new Date(dayEntries[0]!.created_at))}
          </h2>
          <div className="space-y-3">
            {dayEntries.map((e) => (
              <EntryCard key={e.id} entry={e} timeFmt={view.timeFmt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
