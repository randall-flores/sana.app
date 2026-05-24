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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <DownloadReportDialog />
      <Button
        variant="outline"
        size="sm"
        className="h-11 w-full gap-2 px-4 sm:w-auto"
        onClick={enter}
      >
        <ListChecks className="h-4 w-4" />
        {t("select")}
      </Button>
    </div>
  );
}
