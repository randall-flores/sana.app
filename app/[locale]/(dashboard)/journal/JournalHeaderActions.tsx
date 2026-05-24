"use client";

import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DownloadReportDialog } from "./DownloadReportDialog";
import { useJournalSelection } from "./JournalSelectionProvider";

export function JournalHeaderActions() {
  const t = useTranslations("report");
  const { selectionMode, enter } = useJournalSelection();

  // While selecting, the floating bar owns the actions.
  if (selectionMode) return null;

  return (
    <div className="flex items-center gap-2">
      <DownloadReportDialog />
      <Button variant="outline" size="sm" className="h-11 gap-2 px-4" onClick={enter}>
        <ListChecks className="h-4 w-4" />
        {t("select")}
      </Button>
    </div>
  );
}
