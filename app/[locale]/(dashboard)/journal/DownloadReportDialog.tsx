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
import { DateRangeControls } from "@/components/journal/DateRangeControls";
import { computeRange, type RangePreset } from "@/lib/dateRange";
import { getReportData } from "./report-actions";
import { generateAndDownload } from "./reportClient";

export function DownloadReportDialog() {
  const t = useTranslations("report");
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<RangePreset>("7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets: { key: RangePreset; label: string }[] = [
    { key: "7", label: t("preset7") },
    { key: "30", label: t("preset30") },
    { key: "all", label: t("presetAll") },
    { key: "custom", label: t("presetCustom") },
  ];

  async function onGenerate() {
    setError(null);
    const range = computeRange(preset, from, to);
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

        <DateRangeControls
          presets={presets}
          preset={preset}
          onPreset={setPreset}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          fromLabel={t("from")}
          toLabel={t("to")}
          idPrefix="report"
        />

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
