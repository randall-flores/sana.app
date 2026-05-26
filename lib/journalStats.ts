// Pure journal-stats helpers — no React, no deps. Shared by the journal list
// overview header and (later) the PDF report. All date math is caller-supplied
// `now` so the viewer's timezone stays the source of truth.

export type Direction = "easing" | "steady" | "worsening";

/** One day in the trend window. `avg` is null when no entry exists that day
 *  (no-entry ≠ zero pain — the sparkline breaks the line on null). */
export type DayPoint = { key: string; date: Date; avg: number | null };

export type Overview = {
  count: number;
  avg: number; // overall mean pain (round in the UI)
  direction: Direction;
  dailySeries: DayPoint[]; // last 14 days, oldest → newest
  worstIndex: number; // index into dailySeries of the highest avg, or -1
  daysWithData: number; // distinct days with an entry inside the 14-day window
};

// Minimum distinct days (within the window) before a trend line is meaningful.
// Below this, the UI/PDF show a "keep logging" placeholder instead of a chart.
// Shared so the screen and the PDF apply the identical rule.
export const MIN_TREND_DAYS = 4;

type StatEntry = { created_at: string; pain_level: number };

/** Calendar-day key in the local timezone of the supplied Date. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;

export function computeOverview(entries: StatEntry[], now: Date): Overview {
  const count = entries.length;
  const avg = count ? mean(entries.map((e) => e.pain_level)) : 0;

  // Direction: recent half vs earlier half, chronologically. Higher pain = worse.
  let direction: Direction = "steady";
  if (count >= 2) {
    const sorted = [...entries].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const earlier = mean(sorted.slice(0, mid).map((e) => e.pain_level));
    const recent = mean(sorted.slice(mid).map((e) => e.pain_level));
    const diff = recent - earlier;
    if (diff > 0.5) direction = "worsening";
    else if (diff < -0.5) direction = "easing";
  }

  // One averaged point per day across the last 14 days (viewer tz).
  const buckets = new Map<string, number[]>();
  for (const e of entries) {
    const k = dayKey(new Date(e.created_at));
    const b = buckets.get(k);
    if (b) b.push(e.pain_level);
    else buckets.set(k, [e.pain_level]);
  }
  const dailySeries: DayPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const vals = buckets.get(dayKey(d));
    dailySeries.push({ key: dayKey(d), date: d, avg: vals && vals.length ? mean(vals) : null });
  }

  let worstIndex = -1;
  let worstVal = -Infinity;
  let daysWithData = 0;
  dailySeries.forEach((p, i) => {
    if (p.avg !== null) {
      daysWithData++;
      if (p.avg > worstVal) {
        worstVal = p.avg;
        worstIndex = i;
      }
    }
  });

  return { count, avg, direction, dailySeries, worstIndex, daysWithData };
}
