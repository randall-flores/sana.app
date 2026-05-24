"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getReportData } from "./report-actions";
import { generateAndDownload } from "./reportClient";

type Preset = "7" | "30" | "all" | "custom";

export function DownloadReportDialog() {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Preset>("7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets: { key: Preset; label: string }[] = [
    { key: "7", label: t("preset7") },
    { key: "30", label: t("preset30") },
    { key: "all", label: t("presetAll") },
    { key: "custom", label: t("presetCustom") },
  ];

  function computeRange(): { from: string | null; to: string | null } | "incomplete" {
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

  async function onGenerate() {
    setError(null);
    const range = computeRange();
    if (range === "incomplete") {
      setError(t("customIncomplete"));
      return;
    }
    setBusy(true);
    try {
      const res = await getReportData(range);
      if (!res.ok) {
        setError(res.error === "no_case" ? t("errorNoCase") : t("error"));
        return;
      }
      if (res.entries.length === 0) {
        setError(t("empty"));
        return;
      }
      // "All entries" names the file by the generated date; ranges by their span.
      await generateAndDownload(res, { useGeneratedDate: preset === "all" });
      setOpen(false);
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-11 w-full gap-2 px-4 sm:w-auto">
          <Download className="h-4 w-4" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {presets.map(({ key, label }) => {
            const active = preset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
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
              <Label htmlFor="report-from">{t("from")}</Label>
              <Input
                id="report-from"
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
                className="h-14 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-to">{t("to")}</Label>
              <Input
                id="report-to"
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
                className="h-14 rounded-xl"
              />
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button onClick={onGenerate} disabled={busy} className="h-[56px] w-full text-base">
          {busy ? t("preparing") : t("generate")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
