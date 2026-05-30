"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  Download,
  FileText,
  Image as ImageIcon,
  ListChecks,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatFileSize";
import { getSignedUrl } from "@/lib/documentUrl";
import { deleteDocuments } from "./actions";

export type DocumentRow = {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

type RowBusy = { id: string; action: "preview" | "download" } | null;
// Pending delete: a single document, or the current bulk selection.
type DeleteTarget = { kind: "single"; doc: DocumentRow } | { kind: "bulk" } | null;

export function DocumentList({ docs }: { docs: DocumentRow[] }) {
  const t = useTranslations("documents");
  const locale = useLocale() as "en" | "es";
  const router = useRouter();
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }),
    [locale],
  );

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rowBusy, setRowBusy] = useState<RowBusy>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleting, startDelete] = useTransition();

  const allSelected = docs.length > 0 && selectedIds.size === docs.length;

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => (prev.size === docs.length ? new Set() : new Set(docs.map((d) => d.id))));

  // Open the document inline in a new tab via a short-lived signed URL.
  const onPreview = async (doc: DocumentRow) => {
    setRowBusy({ id: doc.id, action: "preview" });
    const res = await getSignedUrl(doc.storage_path);
    setRowBusy(null);
    if (res.ok) window.open(res.url, "_blank", "noopener");
    else toast.error(t("openError"));
  };

  // Save the file under its original name. The signed URL is cross-origin, so a
  // bare <a download> can't rename it — we ask Storage to set the attachment
  // filename via the `download` query param, then click a temporary <a>.
  const onDownload = async (doc: DocumentRow) => {
    setRowBusy({ id: doc.id, action: "download" });
    const res = await getSignedUrl(doc.storage_path);
    setRowBusy(null);
    if (!res.ok) {
      toast.error(t("downloadError"));
      return;
    }
    const sep = res.url.includes("?") ? "&" : "?";
    const href = `${res.url}${sep}download=${encodeURIComponent(doc.file_name)}`;
    const a = document.createElement("a");
    a.href = href;
    a.download = doc.file_name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const ids = deleteTarget.kind === "single" ? [deleteTarget.doc.id] : Array.from(selectedIds);
    startDelete(async () => {
      const res = await deleteDocuments(ids);
      if (res.ok) {
        setDeleteTarget(null);
        exitSelection();
        toast.success(t("deleted", { count: res.count }));
        router.refresh();
      } else {
        toast.error(t("deleteError"));
      }
    });
  };

  const deleteCount = deleteTarget?.kind === "single" ? 1 : selectedIds.size;

  return (
    <div className="space-y-4">
      {/* Toolbar: enter selection, or select-all + count + delete + done. */}
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        {selectionMode ? (
          <>
            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-foreground"
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md border-2 transition",
                  allSelected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {allSelected && <Check className="h-4 w-4" />}
              </span>
              {t("selectAll")}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground" aria-live="polite">
                {t("selectedCount", { count: selectedIds.size })}
              </span>
              {selectedIds.size > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-11 gap-1.5 px-4"
                  onClick={() => setDeleteTarget({ kind: "bulk" })}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" className="h-11 px-4" onClick={exitSelection}>
                {t("selectExit")}
              </Button>
            </div>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto h-11 gap-2 px-4"
            onClick={() => setSelectionMode(true)}
          >
            <ListChecks className="h-4 w-4" />
            {t("select")}
          </Button>
        )}
      </div>

      <ul className="space-y-3">
        {docs.map((doc) => {
          const Icon = doc.mime_type === "application/pdf" ? FileText : ImageIcon;
          const selected = selectedIds.has(doc.id);
          const previewing = rowBusy?.id === doc.id && rowBusy.action === "preview";
          const downloading = rowBusy?.id === doc.id && rowBusy.action === "download";

          const meta = (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                  {doc.mime_type === "application/pdf" ? t("typePdf") : t("typeImage")}
                </span>
                <span className="tabular-nums">{formatFileSize(doc.file_size)}</span>
                <span aria-hidden>·</span>
                <time dateTime={doc.created_at}>{dateFmt.format(new Date(doc.created_at))}</time>
              </div>
            </div>
          );

          // Selection mode: the whole card is a checkbox; tapping toggles it.
          if (selectionMode) {
            return (
              <li key={doc.id}>
                <Card
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={doc.file_name}
                  tabIndex={0}
                  onClick={() => toggle(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggle(doc.id);
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-2xl shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-2 border-primary bg-primary/5" : "border border-border/70 hover:border-primary/50",
                  )}
                >
                  <CardContent className="flex min-h-[56px] items-center gap-3 p-4">
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {selected && <Check className="h-4 w-4" />}
                    </span>
                    {meta}
                  </CardContent>
                </Card>
              </li>
            );
          }

          // Normal mode: tap the row to preview; per-row download + delete actions.
          return (
            <li key={doc.id}>
              <Card className="rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-2 p-2 pl-4">
                  <button
                    type="button"
                    onClick={() => onPreview(doc)}
                    aria-label={t("preview", { name: doc.file_name })}
                    className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-xl py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      {previewing ? (
                        <Loader2 className="h-5 w-5 text-primary motion-safe:animate-spin" aria-hidden />
                      ) : (
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                      )}
                    </span>
                    {meta}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label={t("download", { name: doc.file_name })}
                    disabled={downloading}
                    onClick={() => onDownload(doc)}
                  >
                    {downloading ? (
                      <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-5 w-5" aria-hidden />
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={t("delete", { name: doc.file_name })}
                    onClick={() => setDeleteTarget({ kind: "single", doc })}
                  >
                    <Trash2 className="h-5 w-5" aria-hidden />
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {/* Confirm — single shows the file name, bulk shows the count. */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === "single" ? t("deleteTitleSingle") : t("deleteTitleBulk", { count: deleteCount })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "single"
                ? t("deleteConfirmSingle", { name: deleteTarget.doc.file_name })
                : t("deleteConfirmBulk", { count: deleteCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className={cn(buttonVariants({ variant: "destructive" }), "h-11 px-4")}
            >
              {deleting ? t("deleting") : t("deleteCta")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
