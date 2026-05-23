// Shared pain-severity color logic.
// Single source for the slider (onboarding + journal) and journal pain badges.
// sage (primary) 1-3 · terracotta (pain-mid) 4-6 · red (pain-high) 7-10.

export type PainSeverity = "low" | "mid" | "high";

export function painSeverity(level: number): PainSeverity {
  if (level <= 3) return "low";
  if (level <= 6) return "mid";
  return "high";
}

type SliderClasses = { text: string; range: string; thumb: string };

export const painSliderClasses: Record<PainSeverity, SliderClasses> = {
  low: {
    text: "text-primary",
    range: "[&_[data-slot=slider-range]]:bg-primary",
    thumb: "[&_[data-slot=slider-thumb]]:border-primary",
  },
  mid: {
    text: "text-pain-mid",
    range: "[&_[data-slot=slider-range]]:bg-pain-mid",
    thumb: "[&_[data-slot=slider-thumb]]:border-pain-mid",
  },
  high: {
    text: "text-pain-high",
    range: "[&_[data-slot=slider-range]]:bg-pain-high",
    thumb: "[&_[data-slot=slider-thumb]]:border-pain-high",
  },
};

export const painBadgeClasses: Record<PainSeverity, string> = {
  low: "bg-primary/10 text-primary",
  mid: "bg-pain-mid/10 text-pain-mid",
  high: "bg-pain-high/10 text-pain-high",
};
