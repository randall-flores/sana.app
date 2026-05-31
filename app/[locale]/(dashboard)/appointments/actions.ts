"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { appointmentSchema, type AppointmentInput } from "@/lib/validation/appointment";

export type ActionResult = { ok: true } | { ok: false; error: string };

const clean = (s: string | undefined) => s?.trim() ?? "";

async function resolveCaseId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "unauthorized" as const, caseId: null };

  // Single-case model — most recent case for this user (RLS also scopes it).
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!caseRow) return { supabase, error: "no_case" as const, caseId: null };
  return { supabase, error: null, caseId: caseRow.id as string };
}

export async function createAppointment(input: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const { supabase, error, caseId } = await resolveCaseId();
  if (error) return { ok: false, error };

  const { error: insertError } = await supabase.from("appointments").insert({
    case_id: caseId,
    title: d.title.trim(),
    appt_at: d.apptAt,
    appt_type: d.apptType,
    location: clean(d.location),
    notes: clean(d.notes),
  });
  if (insertError) return { ok: false, error: "generic" };

  revalidatePath("/[locale]/appointments", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function updateAppointment(id: string, input: AppointmentInput): Promise<ActionResult> {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const d = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  // RLS (appts_update_own) scopes this to the owner — a guessed id from another
  // user is rejected at the database, not just here.
  const { error } = await supabase
    .from("appointments")
    .update({
      title: d.title.trim(),
      appt_at: d.apptAt,
      appt_type: d.apptType,
      location: clean(d.location),
      notes: clean(d.notes),
    })
    .eq("id", id);
  if (error) return { ok: false, error: "generic" };

  revalidatePath("/[locale]/appointments", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}

export async function deleteAppointment(id: string): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: "generic" };

  revalidatePath("/[locale]/appointments", "page");
  revalidatePath("/[locale]/dashboard", "page");
  return { ok: true };
}
