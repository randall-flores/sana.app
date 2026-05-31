"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type SummaryData = {
  summary_text: string;
  entry_count_at_generation: number;
  generated_at: string;
};

// "Your recovery" dashboard card. Three states: locked (<3 entries), invite
// (3+, no summary), and summary (exists, with regenerate + staleness nudge).
// The model writes the summary in the user's language; only chrome uses next-intl.
export function RecoverySummaryCard({
  initialSummary,
  entryCount,
}: {
  initialSummary: SummaryData | null;
  entryCount: number;
}) {
  const t = useTranslations("summary");
  const locale = useLocale() as "en" | "es";
  const router = useRouter();

  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  // Capture "now" once at mount — Date.now() in render is impure (React Compiler).
  const [now] = useState(() => Date.now());

  const unlocked = entryCount >= 3;
  const newSince = summary ? entryCount - summary.entry_count_at_generation : 0;

  const relativeTime = (iso: string) => {
    const diffMs = now - new Date(iso).getTime();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const mins = Math.round(diffMs / 60000);
    if (Math.abs(mins) < 60) return rtf.format(-mins, "minute");
    const hrs = Math.round(mins / 60);
    if (Math.abs(hrs) < 24) return rtf.format(-hrs, "hour");
    return rtf.format(-Math.round(hrs / 24), "day");
  };

  const generate = () =>
    startTransition(async () => {
      try {
        const res = await fetch("/api/summary", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.summary) {
          setSummary(data.summary as SummaryData);
          setOpen(true);
          router.refresh();
        } else {
          toast.error(data.error === "not_enough_entries" ? t("locked") : t("error"));
        }
      } catch {
        toast.error(t("error"));
      }
    });

  return (
    <Card className="mt-10 rounded-2xl border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="rounded-2xl bg-primary/10 p-3">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <CardTitle className="font-display text-lg font-semibold">{t("title")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* State A: locked — fewer than 3 entries */}
        {!unlocked && <p className="text-sm text-muted-foreground">{t("locked")}</p>}

        {/* State B: unlocked, no summary yet */}
        {unlocked && !summary && (
          <>
            <p className="text-sm text-muted-foreground">{t("invite")}</p>
            <Button
              type="button"
              onClick={generate}
              disabled={pending}
              className="h-[56px] w-full gap-2 text-base sm:w-auto sm:px-8"
            >
              {pending ? (
                <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
              ) : (
                <Sparkles className="h-5 w-5" aria-hidden />
              )}
              {pending ? t("loading") : t("generate")}
            </Button>
          </>
        )}

        {/* State C: summary exists */}
        {unlocked && summary && (
          <div className="space-y-3">
            <Collapsible open={open} onOpenChange={setOpen}>
              {/* Preview clamps; expand to read the full summary. */}
              <p
                className={cn(
                  "whitespace-pre-line text-sm leading-relaxed text-foreground/90",
                  !open && "line-clamp-4",
                )}
              >
                {summary.summary_text}
              </p>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-11 gap-1.5 px-3 text-primary"
                >
                  {open ? t("showLess") : t("showMore")}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
                    aria-hidden
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent />
            </Collapsible>

            {newSince > 0 && (
              <p className="rounded-xl bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
                {t("nudge", { count: newSince })}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-3">
              <span className="text-xs text-muted-foreground">
                {t("updated", { time: relativeTime(summary.generated_at) })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generate}
                disabled={pending}
                className="h-11 gap-2 px-4"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-4 w-4" aria-hidden />
                )}
                {pending ? t("loading") : t("regenerate")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
