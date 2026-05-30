import imageCompression from "browser-image-compression";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Keep these in lockstep with the case-documents bucket config
// (migration 20260530000001_documents.sql): 10 MB cap, phone-friendly types.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
] as const;
// File-input accept string. Camera capture is enabled at the call site.
export const ACCEPT_ATTR = "image/*,application/pdf";

const BUCKET = "case-documents";

export type UploadErrorCode =
  | "unsupported_type"
  | "too_large"
  | "compress_failed"
  | "upload_failed"
  | "insert_failed";

export type DocumentRow = {
  id: string;
  case_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

export type UploadResult =
  | { ok: true; row: DocumentRow }
  | { ok: false; error: UploadErrorCode };

// Convert + shrink images client-side so uploads stay small on phone data.
// HEIC/PNG/WebP/JPEG all collapse to JPEG; ~1600px long edge; aim under ~1.5 MB.
async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    fileType: "image/jpeg",
    useWebWorker: true,
  });
}

// Upload one file: convert/compress if image, pass PDFs through, store in the
// private bucket, then record a row. If the row insert fails after the object
// uploaded, the object is deleted so no orphan is left behind.
export async function uploadDocument(
  file: File,
  userId: string,
  caseId: string,
): Promise<UploadResult> {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) return { ok: false, error: "unsupported_type" };

  const supabase = createSupabaseBrowserClient();

  // Build the body: images become compressed JPEG; PDFs are untouched.
  let body: File;
  let mimeType: string;
  let ext: string;
  try {
    if (isImage) {
      body = await compressImage(file);
      mimeType = "image/jpeg";
      ext = "jpg";
    } else {
      body = file;
      mimeType = "application/pdf";
      ext = "pdf";
    }
  } catch {
    return { ok: false, error: "compress_failed" };
  }

  // Final size is what actually lands in storage (post-compression for images).
  if (body.size > MAX_FILE_BYTES) return { ok: false, error: "too_large" };

  // Path is load-bearing for storage RLS: the top folder MUST be the user id,
  // or the "case docs insert own" policy denies the upload.
  // {user_id}/{case_id}/{uuid}.{ext} — random name avoids collisions + sanitizing.
  const storagePath = `${userId}/${caseId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, body, { contentType: mimeType, upsert: false });
  if (uploadError) return { ok: false, error: "upload_failed" };

  // Record the row. file_name keeps the human-readable original for display;
  // file_size is the FINAL (compressed) size that actually lives in the bucket.
  const { data, error: insertError } = await supabase
    .from("documents")
    .insert({
      case_id: caseId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: mimeType,
      file_size: body.size,
    })
    .select()
    .single();

  if (insertError || !data) {
    // Object uploaded but the row didn't — clean up the orphan.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, error: "insert_failed" };
  }

  return { ok: true, row: data as DocumentRow };
}
