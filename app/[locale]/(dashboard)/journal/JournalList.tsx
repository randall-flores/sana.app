"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronDown, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { painBadgeClasses, painSeverity } from "@/lib/pain";
import { computeOverview, dayKey, type DayPoint, type Direction } from "@/lib/journalStats";
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

// Severity → text color (reuses the lib/pain mapping, not a new one).
const SEV_TEXT = { low: "text-primary", mid: "text-pain-mid", high: "text-pain-high" } as const;

// Hand-rolled 14-day sparkline (no charting lib). Breaks the line on no-entry
// days; isolated days render as a dot; the worst day is marked.
function TrendSparkline({
  series,
  worstIndex,
  color,
}: {
  series: DayPoint[];
  worstIndex: number;
  color: string;
}) {
  const W = 300;
  const H = 56;
  const pad = 5;
  const n = series.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - (v / 10) * (H - 2 * pad); // pain 0..10, higher = up

  // Group consecutive non-null days into segments.
  const segments: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  series.forEach((p, i) => {
    if (p.avg === null) {
      if (cur.length) segments.push(cur);
      cur = [];
    } else {
      cur.push({ i, v: p.avg });
    }
  });
  if (cur.length) segments.push(cur);

  const worst = worstIndex >= 0 ? series[worstIndex] : undefined;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-14 w-full"
      role="img"
      aria-hidden
    >
      {segments.map((seg, si) =>
        seg.length === 1 ? (
          <circle key={si} cx={x(seg[0]!.i)} cy={y(seg[0]!.v)} r={2.5} fill={color} />
        ) : (
          <polyline
            key={si}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={seg.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
          />
        )
      )}
      {worst && worst.avg !== null && (
        <circle
          cx={x(worstIndex)}
          cy={y(worst.avg)}
          r={3.5}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
}

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

type Filter = "all" | "severe" | "week" | "area";

export function JournalList({ entries }: { entries: JournalRow[] }) {
  const t = useTranslations("journal");
  const locale = useLocale() as "en" | "es";

  const [filter, setFilter] = useState<Filter>("all");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  // Date grouping depends on the browser timezone, which the server doesn't
  // know — render only on the client so SSR and client agree (no hydration drift).
  // useSyncExternalStore returns false during SSR, true after hydration.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const areaLabel = (loc: string) =>
    loc in REGION_LABELS ? labelFor(loc, locale) : t(`locations.${loc}`);

  // Unique areas present across all entries (for the "By area" selector).
  const allAreas = useMemo(() => {
    const s = new Set<string>();
    for (const e of entries) for (const l of e.pain_locations ?? []) s.add(l);
    return Array.from(s);
  }, [entries]);

  // Filter BEFORE grouping. Date math ("This week") only matters post-mount.
  const filtered = useMemo(() => {
    if (filter === "severe") return entries.filter((e) => e.pain_level >= 7);
    if (filter === "week") {
      const cut = Date.now() - 7 * 86_400_000;
      return entries.filter((e) => new Date(e.created_at).getTime() >= cut);
    }
    if (filter === "area" && areaFilter)
      return entries.filter((e) => e.pain_locations?.includes(areaFilter));
    return entries;
  }, [entries, filter, areaFilter]);

  const view = useMemo(() => {
    const groups = new Map<string, JournalRow[]>();
    for (const e of filtered) {
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
  }, [filtered, locale]);

  // Overview from the FULL set (not the filtered view). `mounted` in deps so the
  // 14-day window recomputes with the client clock after hydration.
  const overview = useMemo(
    () => computeOverview(entries, new Date()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, mounted]
  );

  if (!mounted) {
    return <div className="h-24 animate-pulse rounded-2xl bg-muted/40" aria-hidden />;
  }

  // No entries at all — the original welcome empty state (no filter bar).
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

  const pill = (key: Filter, label: string, onClick: () => void) => (
    <button
      key={key}
      type="button"
      aria-pressed={filter === key}
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition",
        filter === key
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {label}
    </button>
  );

  // Overview presentation: direction word/icon/color + trend line color.
  const dirMeta: Record<Direction, { Icon: typeof Minus; cls: string; key: string }> = {
    easing: { Icon: TrendingDown, cls: "text-primary", key: "list.dirEasing" },
    steady: { Icon: Minus, cls: "text-muted-foreground", key: "list.dirSteady" },
    worsening: { Icon: TrendingUp, cls: "text-pain-high", key: "list.dirWorsening" },
  };
  const dir = dirMeta[overview.direction];
  const DirIcon = dir.Icon;
  const avgSev = painSeverity(overview.avg);
  const lineColor = {
    low: "var(--color-primary)",
    mid: "var(--color-pain-mid)",
    high: "var(--color-pain-high)",
  }[avgSev];
  const hasTrend = overview.dailySeries.some((p) => p.avg !== null);

  return (
    <div className="space-y-6">
      {/* Overview header */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("list.statEntries")}
              </p>
              <p className="mt-1 font-display text-2xl tabular-nums">{overview.count}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/70 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("list.statAvg")}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className={cn("font-display text-2xl tabular-nums", SEV_TEXT[avgSev])}>
                  {overview.avg.toFixed(1)}
                </span>
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", dir.cls)}>
                  <DirIcon className="h-3.5 w-3.5" aria-hidden />
                  {t(dir.key)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("list.trendCaption")}
            </p>
            {hasTrend ? (
              <TrendSparkline
                series={overview.dailySeries}
                worstIndex={overview.worstIndex}
                color={lineColor}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("list.trendEmpty")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {pill("all", t("list.filterAll"), () => {
          setFilter("all");
          setAreaFilter(null);
        })}
        {pill("severe", t("list.filterSevere"), () => {
          setFilter("severe");
          setAreaFilter(null);
        })}
        {pill("week", t("list.filterWeek"), () => {
          setFilter("week");
          setAreaFilter(null);
        })}
        {allAreas.length > 0 &&
          pill("area", t("list.filterArea"), () => {
            setFilter("area");
            setAreaFilter(allAreas[0]!);
          })}
      </div>

      {/* Area selector (only in "By area" mode) */}
      {filter === "area" && allAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allAreas.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={areaFilter === a}
              onClick={() => setAreaFilter(a)}
              className={cn(
                "h-9 shrink-0 rounded-full px-3 text-xs font-medium ring-1 transition",
                areaFilter === a
                  ? "bg-primary/10 text-primary ring-primary"
                  : "bg-background text-muted-foreground ring-border hover:text-foreground"
              )}
            >
              {areaLabel(a)}
            </button>
          ))}
        </div>
      )}

      {/* Grouped list, or a friendly empty state when the filter excludes everything */}
      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/70 bg-transparent shadow-none">
          <CardContent className="p-8 text-center text-muted-foreground">
            {t("list.emptyFiltered")}
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
