"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity, ChevronDown, Pill, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { painBadgeClasses, painSeverity } from "@/lib/pain";

export type JournalRow = {
  id: string;
  created_at: string;
  pain_level: number;
  notes: string | null;
  pain_locations: string[] | null;
  pain_quality: string[] | null;
  daily_impact: string | null;
  mood: string | null;
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

  const sev = painSeverity(entry.pain_level);
  const hasQuality = !!entry.pain_quality && entry.pain_quality.length > 0;
  const hasImpact = !!entry.daily_impact && entry.daily_impact.trim().length > 0;
  const hasMood = !!entry.mood;
  const hasMeds = !!entry.medications && entry.medications.trim().length > 0;
  const hasDetail = hasQuality || hasImpact || hasMood || hasMeds;

  return (
    <Card className="rounded-2xl border-border/70 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
              painBadgeClasses[sev]
            )}
          >
            {t("painBadge", { level: entry.pain_level })}
          </span>
          <time className="text-sm text-muted-foreground">
            {timeFmt.format(new Date(entry.created_at))}
          </time>
        </div>

        {entry.pain_locations && entry.pain_locations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.pain_locations.map((loc) => (
              <span
                key={loc}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
              >
                {t(`locations.${loc}`)}
              </span>
            ))}
          </div>
        )}

        {entry.notes && <p className="line-clamp-2 text-sm text-foreground/90">{entry.notes}</p>}

        {hasDetail && (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="-mx-2 flex h-auto min-h-[56px] w-full items-center justify-between gap-3 rounded-xl px-2 text-muted-foreground hover:bg-muted/50"
              >
                {/* Presence hints (mood/meds/impact) — match the compact list cue. */}
                <span className="flex items-center gap-3 text-xs">
                  {hasMood && (
                    <span className="inline-flex items-center gap-1">
                      <Smile className="h-4 w-4" aria-hidden />
                      {t(`mood.${entry.mood}`)}
                    </span>
                  )}
                  {hasMeds && (
                    <span className="inline-flex items-center gap-1">
                      <Pill className="h-4 w-4" aria-hidden />
                      <span className="sr-only">{t("detail.medications")}</span>
                    </span>
                  )}
                  {hasImpact && (
                    <span className="inline-flex items-center gap-1">
                      <Activity className="h-4 w-4" aria-hidden />
                      <span className="sr-only">{t("detail.impact")}</span>
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  {open ? t("showLess") : t("showMore")}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                  />
                </span>
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-3">
              {hasQuality && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("detail.quality")}
                  </p>
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
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("detail.impact")}
                  </p>
                  <p className="text-sm text-foreground/90">{entry.daily_impact}</p>
                </div>
              )}

              {hasMood && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("detail.mood")}
                  </p>
                  <p className="text-sm text-foreground/90">{t(`mood.${entry.mood}`)}</p>
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
        )}
      </CardContent>
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
