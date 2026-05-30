"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2, Plus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPT_ATTR, uploadDocument, type UploadErrorCode } from "@/lib/uploadDocument";

type ItemStatus = "uploading" | "done" | "error";
type QueueItem = { id: string; name: string; status: ItemStatus; error?: UploadErrorCode };

// Primary upload surface for the Documents section. The case is resolved on the
// server and passed in, so the user never picks a case here. The whole zone is a
// tap target on phones (opens the picker, camera-capable); desktop adds drag-drop.
export function DocumentUpload({ userId, caseId }: { userId: string; caseId: string }) {
  const t = useTranslations("documents");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const openPicker = () => inputRef.current?.click();

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Seed the queue; drop any finished items from a previous batch.
    const items: QueueItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      status: "uploading",
    }));
    setQueue(items);
    setBusy(true);

    let added = 0;
    // Sequential so per-file status reads clearly on a phone.
    for (let i = 0; i < files.length; i += 1) {
      const res = await uploadDocument(files[i]!, userId, caseId);
      setQueue((prev) =>
        prev.map((it) =>
          it.id === items[i]!.id
            ? { ...it, status: res.ok ? "done" : "error", error: res.ok ? undefined : res.error }
            : it,
        ),
      );
      if (res.ok) added += 1;
    }

    setBusy(false);
    if (added > 0) {
      toast.success(t("added", { count: added }));
      router.refresh(); // re-fetch the server-rendered list
    }
  };

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked later
    await processFiles(files);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    await processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        capture="environment"
        multiple
        onChange={onInputChange}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />

      {/* Dropzone: drag-drop target (desktop). The button is the control; the
          surrounding dashed area accepts dropped files. */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "border-border/70",
        )}
      >
        <span className="rounded-2xl bg-primary/10 p-3">
          <UploadCloud className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {t("dropTitle")} <span>{t("dropOr")}</span>
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={openPicker}
          className="h-14 w-full gap-2 text-base sm:w-auto sm:px-8"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 motion-safe:animate-spin" aria-hidden />
          ) : (
            <Plus className="h-5 w-5" aria-hidden />
          )}
          {busy ? t("adding") : t("add")}
        </Button>
        <p className="text-sm text-muted-foreground">{t("hint")}</p>
      </div>

      {/* Per-file status queue. Rendered unconditionally so the aria-live region
          already exists when the first item appears — AT only announces mutations
          to a region that was already in the DOM. */}
      <ul className="space-y-2" aria-live="polite">
        {queue.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3"
            >
              <span className="shrink-0">
                {it.status === "uploading" && (
                  <Loader2 className="h-4 w-4 text-muted-foreground motion-safe:animate-spin" aria-hidden />
                )}
                {it.status === "done" && <Check className="h-4 w-4 text-primary" aria-hidden />}
                {it.status === "error" && <X className="h-4 w-4 text-destructive" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{it.name}</p>
                {it.status === "error" && it.error && (
                  <p className="text-xs text-destructive">{t(`error.${it.error}`)}</p>
                )}
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  it.status === "done" && "text-primary",
                  it.status === "error" && "text-destructive",
                  it.status === "uploading" && "text-muted-foreground",
                )}
              >
                {it.status === "done" && t("queueDone")}
                {it.status === "error" && t("queueError")}
                {it.status === "uploading" && t("adding")}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
