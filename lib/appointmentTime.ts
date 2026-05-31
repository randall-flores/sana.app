// Friendly relative datetime for appointments. Plain module (no React, no deps)
// so it's usable anywhere. All date math is caller-supplied `now` + the viewer's
// local timezone — never compute on the server, where the tz is unknown.
// Returns PARTS; the component composes them with next-intl so "at"/"a las" and
// the relative day word stay localized.

export type RelativeDay = "today" | "tomorrow" | "yesterday" | "date";

export type FriendlyParts = {
  day: RelativeDay;
  /** Localized weekday + date, e.g. "Mon, Jun 2" — only meaningful when day === "date". */
  dateStr: string;
  /** Localized time, e.g. "9:00 AM" / "9:00". */
  timeStr: string;
};

const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export function friendlyDateTime(iso: string, now: Date, locale: "en" | "es"): FriendlyParts {
  const d = new Date(iso);
  const timeStr = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(d);

  // Calendar-day difference in the viewer's local timezone (not raw ms).
  const diffDays = Math.round(
    (startOfLocalDay(d).getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
  );

  let day: RelativeDay;
  if (diffDays === 0) day = "today";
  else if (diffDays === 1) day = "tomorrow";
  else if (diffDays === -1) day = "yesterday";
  else day = "date";

  const dateStr = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);

  return { day, dateStr, timeStr };
}
