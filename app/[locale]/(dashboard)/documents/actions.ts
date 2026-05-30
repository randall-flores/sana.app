"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "case-documents";

export type DeleteResult = { ok: true; count: number } | { ok: false; error: string };

// Delete one or many documents. Storage object(s) and table row(s) must go
// together. Order matters (orphan trap): remove the storage object(s) FIRST,
// and only delete the row(s) if that succeeds — a row pointing at a missing
// file is the worse failure. The storage_paths are resolved server-side from
// the ids (RLS scopes the lookup to the owner), so the client can't delete
// another user's files by passing arbitrary paths.
export async function deleteDocuments(ids: string[]): Promise<DeleteResult> {
  if (ids.length === 0) return { ok: false, error: "empty" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // RLS (documents_select_own) restricts this to the caller's own rows.
  const { data: rows, error: selectError } = await supabase
    .from("documents")
    .select("id, storage_path")
    .in("id", ids);
  if (selectError) return { ok: false, error: "generic" };
  if (!rows || rows.length === 0) return { ok: false, error: "not_found" };

  const ownedIds = rows.map((r) => r.id as string);
  const paths = rows.map((r) => r.storage_path as string);

  // Remove storage objects first. One .remove([...]) call handles the bulk case.
  const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
  if (storageError) return { ok: false, error: "storage" };

  // Storage gone — now delete the rows in one query (RLS-scoped delete).
  const { error: rowError } = await supabase.from("documents").delete().in("id", ownedIds);
  if (rowError) return { ok: false, error: "row" };

  revalidatePath("/[locale]/documents", "page");
  return { ok: true, count: ownedIds.length };
}
