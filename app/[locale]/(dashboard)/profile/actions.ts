"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { localeSchema, updateNameSchema } from "@/lib/validation/profile";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateName(fullName: string): Promise<ActionResult> {
  const parsed = updateNameSchema.safeParse({ fullName });
  if (!parsed.success) return { ok: false, error: "validation" };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (error) return { ok: false, error: "generic" };

  return { ok: true };
}

export async function updateLanguage(next: string): Promise<ActionResult> {
  const parsed = localeSchema.safeParse(next);
  if (!parsed.success) return { ok: false, error: "validation" };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: parsed.data })
    .eq("id", user.id);
  if (error) return { ok: false, error: "generic" };

  return { ok: true };
}
