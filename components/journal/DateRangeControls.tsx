"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RangePreset } from "@/lib/dateRange";

// Shared preset grid + custom from/to inputs. Used by the report download
// dialog and the journal list date filter so the two stay identical.
export function DateRangeControls({
  presets,
  preset,
  onPreset,
  from,
  setFrom,
  to,
  setTo,
  fromLabel,
  toLabel,
  idPrefix,
}: {
  presets: { key: RangePreset; label: string }[];
  preset: RangePreset;
  onPreset: (p: RangePreset) => void;
  from: string;
  setFrom: (v: string) => void;
  to: string;
  setTo: (v: string) => void;
  fromLabel: string;
  toLabel: string;
  idPrefix: string;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {presets.map(({ key, label }) => {
          const active = preset === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPreset(key)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[56px] items-center justify-center rounded-xl px-4 text-center text-sm font-medium transition",
                active
                  ? "border-2 border-primary bg-primary/10 text-foreground"
                  : "border border-border text-muted-foreground hover:border-primary/60"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-from`}>{fromLabel}</Label>
            <Input
              id={`${idPrefix}-from`}
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="h-14 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-to`}>{toLabel}</Label>
            <Input
              id={`${idPrefix}-to`}
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="h-14 rounded-xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
