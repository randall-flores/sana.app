"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useJournalSelection } from "./JournalSelectionProvider";
import { getReportData } from "./report-actions";
import { generateAndDownload } from "./reportClient";

export function SelectBar() {
  const t = useTranslations("report");
  const { selectionMode, selectedIds, count, exit } = useJournalSelection();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectionMode) return null;

  async function onDownload() {
    if (count === 0) return;
    setError(null);
    setBusy(true);
    try {
      const res = await getReportData({ ids: Array.from(selectedIds) });
      if (!res.ok) {
        setError(res.error === "no_case" ? t("errorNoCase") : t("error"));
        return;
      }
      if (res.entries.length === 0) {
        setError(t("empty"));
        return;
      }
      // Cherry-picked set → filename uses the generated date.
      await generateAndDownload(res, { useGeneratedDate: true });
      exit();
    } catch {
      setError(t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-6 py-3">
        <span className="text-sm font-medium" aria-live="polite">
          {t("selectedCount", { count })}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={exit} disabled={busy} className="h-11 px-4">
            {t("cancel")}
          </Button>
          <Button onClick={onDownload} disabled={busy || count === 0} className="h-11 px-4">
            {busy ? t("preparing") : t("button")}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="px-6 pb-2 text-center text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
