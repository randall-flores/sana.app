"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity, Pill, Smile } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
            {dayEntries.map((e) => {
              const sev = painSeverity(e.pain_level);
              return (
                <Card key={e.id} className="rounded-2xl border-border/70 shadow-sm">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold",
                          painBadgeClasses[sev]
                        )}
                      >
                        {t("painBadge", { level: e.pain_level })}
                      </span>
                      <time className="text-sm text-muted-foreground">
                        {view.timeFmt.format(new Date(e.created_at))}
                      </time>
                    </div>

                    {e.pain_locations && e.pain_locations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {e.pain_locations.map((loc) => (
                          <span
                            key={loc}
                            className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
                          >
                            {t(`locations.${loc}`)}
                          </span>
                        ))}
                      </div>
                    )}

                    {e.notes && (
                      <p className="line-clamp-2 text-sm text-foreground/90">{e.notes}</p>
                    )}

                    {(e.mood || e.medications || e.daily_impact) && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                        {e.mood && (
                          <span className="inline-flex items-center gap-1">
                            <Smile className="h-4 w-4" aria-hidden />
                            {t(`mood.${e.mood}`)}
                          </span>
                        )}
                        {e.medications && (
                          <span className="inline-flex items-center gap-1" title={t("detail.medications")}>
                            <Pill className="h-4 w-4" aria-hidden />
                            <span className="sr-only">{t("detail.medications")}</span>
                          </span>
                        )}
                        {e.daily_impact && (
                          <span className="inline-flex items-center gap-1" title={t("detail.impact")}>
                            <Activity className="h-4 w-4" aria-hidden />
                            <span className="sr-only">{t("detail.impact")}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
