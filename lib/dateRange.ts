// Shared date-range logic for the report download and the journal list filter,
// so both interpret presets/custom ranges identically. Pure, no deps.

export type RangePreset = "7" | "30" | "all" | "custom";

export type Range = { from: string | null; to: string | null };

/** Resolve a preset + custom inputs to ISO bounds. "all" → open range,
 *  "custom" with a missing field → "incomplete". */
export function computeRange(
  preset: RangePreset,
  from: string,
  to: string
): Range | "incomplete" {
  if (preset === "all") return { from: null, to: null };
  if (preset === "custom") {
    if (!from || !to) return "incomplete";
    return {
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T23:59:59.999`).toISOString(),
    };
  }
  const days = preset === "7" ? 7 : 30;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { from: start.toISOString(), to: end.toISOString() };
}
