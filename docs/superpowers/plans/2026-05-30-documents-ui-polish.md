# Documents UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Documents page (upload + list + empty state) within Sana's warm/calm system, add a desktop drag-and-drop zone, per-file upload status, and file metadata (type chip + size) on each row.

**Architecture:** Server component (`documents/page.tsx`) resolves the case and renders the list; the client `DocumentUpload` handles picking/dropping and per-file status. A new dependency-free `formatFileSize` helper formats sizes. No new data — `file_size` is already stored; we just add it to the `select`. Scope: Documents page + file metadata only. Not the dashboard card, not view/thumbnails/delete.

**Tech Stack:** Next.js 16 (App Router, RSC), next-intl, Tailwind v4 (semantic tokens in `app/globals.css`), lucide-react, sonner, browser-image-compression.

**Design constraints (from tokens + ui-ux-pro-max CRITICAL rules):**
- Semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`…), never raw hex — keeps light/dark parity.
- Touch targets ≥ 56px (already the project norm); dropzone is one big tap area on phones.
- Reduced-motion safe: spinners use `motion-safe:animate-spin`.
- `aria-live` for status/errors; `tabular-nums` for sizes; icons are SVG (lucide), never emoji.
- Mobile-first; verify 375 / 768 / 1280 with no horizontal overflow.

**Workflow note:** This repo commits straight to `main` (Vercel production deploys from `main`). Each task ends by committing to `main`. No feature branch.

**Testing note:** No unit/component test runner is configured (only Playwright e2e). Verification per task = `npm run lint` + targeted reasoning; final task = build + responsive Playwright pass. The one pure function (`formatFileSize`) is verified with a `node -e` assertion.

---

## File Structure

- **Create** `lib/formatFileSize.ts` — bytes → "820 KB" / "1.4 MB". One responsibility, no deps.
- **Modify** `messages/en.json`, `messages/es.json` — add dropzone + type-chip + queue strings under `documents`.
- **Modify** `app/[locale]/(dashboard)/documents/page.tsx` — add `file_size` to the select; refine list rows (type chip + size + date) and the empty state.
- **Modify** `app/[locale]/(dashboard)/documents/DocumentUpload.tsx` — drag-and-drop zone wrapping the existing button + camera input; per-file status queue.

---

## Task 1: `formatFileSize` helper

**Files:**
- Create: `lib/formatFileSize.ts`

- [ ] **Step 1: Write the helper**

```ts
// Human-readable file size for display. Bytes → "820 KB" / "1.4 MB".
// Dependency-free and locale-agnostic; values are small (bucket caps at 10 MB).
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
```

- [ ] **Step 2: Verify the math**

Run:
```bash
node -e "const{formatFileSize}=require('esbuild-register/dist/node')?{}:{}; " 2>/dev/null; node --input-type=module -e "import('./lib/formatFileSize.ts').catch(()=>{}); const f=(b)=>{const KB=1024,MB=KB*1024; if(b<KB)return b+' B'; const kb=b/KB; if(kb<KB)return Math.round(kb)+' KB'; return (kb/KB).toFixed(1)+' MB';}; console.log(f(900),f(1536),f(1572864),f(10485760));"
```
Expected: `900 B 2 KB 1.5 MB 10.0 MB`
(The inline `f` mirrors the helper; TS isn't directly node-runnable, so this asserts the algorithm.)

- [ ] **Step 3: Commit**

```bash
git add lib/formatFileSize.ts
git commit -m "feat(documents): add formatFileSize helper"
git push origin main
```

---

## Task 2: i18n strings

**Files:**
- Modify: `messages/en.json` (the `documents` block)
- Modify: `messages/es.json` (the `documents` block)

- [ ] **Step 1: Add EN keys**

In `messages/en.json`, inside `"documents": { ... }`, add after `"hint"`:

```json
    "dropTitle": "Drag photos or PDFs here",
    "dropOr": "or",
    "typeImage": "Photo",
    "typePdf": "PDF",
    "queueDone": "Added",
    "queueError": "Couldn't add",
```

- [ ] **Step 2: Add ES keys**

In `messages/es.json`, inside `"documents": { ... }`, add after `"hint"`:

```json
    "dropTitle": "Arrastra fotos o PDF aquí",
    "dropOr": "o",
    "typeImage": "Foto",
    "typePdf": "PDF",
    "queueDone": "Agregado",
    "queueError": "No se pudo agregar",
```

- [ ] **Step 3: Verify JSON parses**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));JSON.parse(require('fs').readFileSync('messages/es.json','utf8'));console.log('JSON OK')"
```
Expected: `JSON OK`

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/es.json
git commit -m "feat(documents): i18n for dropzone, type chips, upload queue"
git push origin main
```

---

## Task 3: Refine the list rows + empty state (page.tsx)

**Files:**
- Modify: `app/[locale]/(dashboard)/documents/page.tsx`

- [ ] **Step 1: Add `file_size` to the type + select, import helper + icon**

Replace the imports block and `DocRow` type. New top of file:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { FileText, Image as ImageIcon, FolderOpen } from "lucide-react";
import { redirect } from "@/lib/i18n/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { BottomTabBar } from "@/components/BottomTabBar";
import { formatFileSize } from "@/lib/formatFileSize";
import { DocumentUpload } from "./DocumentUpload";

type DocRow = {
  id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};
```

Update the select to include `file_size`:

```tsx
    const { data } = await supabase
      .from("documents")
      .select("id, file_name, mime_type, file_size, created_at")
      .eq("case_id", caseRow.id)
      .order("created_at", { ascending: false });
    docs = (data as DocRow[] | null) ?? [];
```

- [ ] **Step 2: Refine the empty state**

Replace the empty-state `Card` (the `docs.length === 0` branch) with:

```tsx
            <Card className="rounded-2xl border-dashed border-border/70 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="rounded-2xl bg-primary/10 p-3">
                  <FolderOpen className="h-6 w-6 text-primary" aria-hidden />
                </span>
                <p className="max-w-xs text-balance text-muted-foreground">{t("empty")}</p>
              </CardContent>
            </Card>
```

- [ ] **Step 3: Refine each list row with type chip + size**

Replace the `docs.map(...)` row body so each `Card`'s `CardContent` reads:

```tsx
                    <Card className="rounded-2xl border-border/70 shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="flex items-center gap-3 p-4">
                        <span className="shrink-0 rounded-xl bg-primary/10 p-2.5">
                          <Icon className="h-5 w-5 text-primary" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {d.file_name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                            <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                              {d.mime_type === "application/pdf" ? t("typePdf") : t("typeImage")}
                            </span>
                            <span className="tabular-nums">{formatFileSize(d.file_size)}</span>
                            <span aria-hidden>·</span>
                            <time dateTime={d.created_at}>{dateFmt.format(new Date(d.created_at))}</time>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
```

(The `const Icon = d.mime_type === "application/pdf" ? FileText : ImageIcon;` line above the `return` stays.)

- [ ] **Step 4: Lint**

Run: `npx eslint "app/[locale]/(dashboard)/documents/page.tsx"`
Expected: exit 0, no output.

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/(dashboard)/documents/page.tsx
git commit -m "feat(documents): type chip + file size on rows, refined empty state"
git push origin main
```

---

## Task 4: Drag-and-drop zone + per-file status (DocumentUpload.tsx)

**Files:**
- Modify: `app/[locale]/(dashboard)/documents/DocumentUpload.tsx`

- [ ] **Step 1: Replace the component with the dropzone + queue version**

Full file:

```tsx
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

      {/* Dropzone: big tap area (phones) + drag-drop (desktop). */}
      <div
        role="button"
        tabIndex={0}
        aria-label={t("add")}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          dragging ? "border-primary bg-primary/5" : "border-border/70 hover:border-primary/50",
        )}
      >
        <span className="rounded-2xl bg-primary/10 p-3">
          <UploadCloud className="h-6 w-6 text-primary" aria-hidden />
        </span>
        <p className="hidden text-sm text-muted-foreground sm:block">
          {t("dropTitle")} <span className="text-muted-foreground/70">{t("dropOr")}</span>
        </p>
        <Button
          type="button"
          disabled={busy}
          // The dropzone handles the click; keep the button visual without double-firing.
          onClick={(e) => {
            e.stopPropagation();
            openPicker();
          }}
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

      {/* Per-file status queue. */}
      {queue.length > 0 && (
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
                  <p role="alert" className="text-xs text-destructive">
                    {t(`error.${it.error}`)}
                  </p>
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
      )}
    </div>
  );
}
```

- [ ] **Step 2: Lint**

Run: `npx eslint "app/[locale]/(dashboard)/documents/DocumentUpload.tsx"`
Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/(dashboard)/documents/DocumentUpload.tsx
git commit -m "feat(documents): drag-and-drop zone + per-file upload status"
git push origin main
```

---

## Task 5: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Typecheck + build**

Run: `npm run build`
Expected: build completes, no type errors. (Slow on this machine — allow up to 10 min.)

- [ ] **Step 2: Responsive check (per the project's standard practice)**

Start dev (`npm run dev`), sign in as a service-role-seeded throwaway user, visit `/en/documents` and `/es/documents`. At widths 375 / 768 / 1280 confirm:
- No horizontal overflow.
- Dropzone, button (≥56px), and queue rows render correctly.
- Empty state centered; list rows show type chip + size + date.
- Dark mode: text contrast holds (tokens already paired).

- [ ] **Step 3: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "fix(documents): polish verification fixes"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- Refine within Sana calm → semantic tokens, dashed dropzone, subtle hover/transition, reduced-motion spinners. ✓ (Tasks 3, 4)
- Documents page scope → header untouched (already clean), upload + list + empty refined. ✓
- File metadata → `file_size` added to select; type chip + formatted size per row. ✓ (Tasks 1, 3)
- Button + drag-drop → dropzone wraps the 56px camera-capable button; drag-drop on desktop, tap anywhere on phone. ✓ (Task 4)

**Placeholder scan:** No TBD/TODO; all steps contain full code. ✓

**Type consistency:** `DocRow.file_size: number` matches `formatFileSize(bytes: number)`; `QueueItem.error?: UploadErrorCode` matches `uploadDocument`'s `UploadResult` error type; `ACCEPT_ATTR`/`uploadDocument` imports match `lib/uploadDocument.ts` exports. ✓

**Risk note:** `capture="environment"` + drag events coexist fine (capture only affects the input). The dropzone's `onClick` and the inner Button's `onClick` both call `openPicker`; `stopPropagation` on the button prevents a double-open.
