"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCEPT_ATTR, uploadDocument, type UploadErrorCode } from "@/lib/uploadDocument";

// Primary "Add document" action for the Documents section. The case is resolved
// on the server and passed in, so the user never picks a case here.
export function DocumentUpload({ userId, caseId }: { userId: string; caseId: string }) {
  const t = useTranslations("documents");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);
  const [error, setError] = useState<UploadErrorCode | null>(null);

  const onPick = () => inputRef.current?.click();

  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // let the same file be re-picked later
    if (files.length === 0) return;

    setBusy(true);
    setError(null);
    let added = 0;
    let firstError: UploadErrorCode | null = null;

    // Sequential so the per-file status reads clearly on a phone.
    for (const file of files) {
      setCurrentName(file.name);
      const res = await uploadDocument(file, userId, caseId);
      if (res.ok) added += 1;
      else if (!firstError) firstError = res.error;
    }

    setCurrentName(null);
    setBusy(false);

    if (added > 0) {
      toast.success(t("added", { count: added }));
      router.refresh(); // re-fetch the list (server component)
    }
    if (firstError) setError(firstError);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        capture="environment"
        multiple
        onChange={onFiles}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />

      <Button
        type="button"
        onClick={onPick}
        disabled={busy}
        className="h-14 w-full gap-2 text-base sm:w-auto sm:px-8"
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Plus className="h-5 w-5" aria-hidden />
        )}
        {busy ? t("adding") : t("add")}
      </Button>

      <p className="text-sm text-muted-foreground">{t("hint")}</p>

      {busy && currentName && (
        <p role="status" className="text-sm text-muted-foreground">
          {t("uploadingFile", { name: currentName })}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t(`error.${error}`)}
        </p>
      )}
    </div>
  );
}
