import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Short-lived signed URLs for the private case-documents bucket. One helper
// serves both preview (open in a new tab) and download (save via <a download>).
// Never expose a public URL — the bucket is private by design.
const BUCKET = "case-documents";
const EXPIRY_SECONDS = 300; // 5 minutes

export type SignedUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: "signed_url_failed" };

export async function getSignedUrl(storagePath: string): Promise<SignedUrlResult> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, EXPIRY_SECONDS);
  if (error || !data?.signedUrl) return { ok: false, error: "signed_url_failed" };
  return { ok: true, url: data.signedUrl };
}
