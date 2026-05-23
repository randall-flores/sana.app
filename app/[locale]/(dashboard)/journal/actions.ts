"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { journalEntrySchema, type JournalEntryInput } from "@/lib/validation/journal";

export type ActionResult = { ok: true } | { ok: false; error: string };

const clean = (s: string | undefined) => {
  const v = s?.trim();
  return v ? v : null;
};

export async function createJournalEntry(input: JournalEntryInput): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // Most recent case for this user (RLS also scopes this to the owner).
  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (caseError || !caseRow) return { ok: false, error: "no_case" };

  const parsed = journalEntrySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const { error: insertError } = await supabase.from("journal_entries").insert({
    case_id: caseRow.id,
    pain_level: d.painLevel,
    notes: clean(d.notes),
    pain_locations: d.painLocations && d.painLocations.length > 0 ? d.painLocations : null,
    pain_quality: d.painQuality && d.painQuality.length > 0 ? d.painQuality : null,
    daily_impact: clean(d.dailyImpact),
    mood: d.mood ?? null,
    medications: clean(d.medications),
  });
  if (insertError) return { ok: false, error: "generic" };

  // Locale-aware: revalidates /en/journal and /es/journal (dynamic segment → type "page").
  revalidatePath("/[locale]/journal", "page");
  return { ok: true };
}
