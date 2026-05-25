"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ReportRow = {
  id: string;
  created_at: string;
  pain_level: number;
  notes: string | null;
  pain_locations: string[] | null;
  pain_quality: string[] | null;
  daily_impact: string | null;
  mood: string[] | null;
  medications: string | null;
};

export type ReportResult =
  | { ok: true; fullName: string; language: "en" | "es"; entries: ReportRow[] }
  | { ok: false; error: string };

export type ReportQuery =
  | { ids: string[] }
  | { from: string | null; to: string | null };

const isIso = (s: string) => !Number.isNaN(Date.parse(s));

export async function getReportData(input: ReportQuery): Promise<ReportResult> {
  if ("from" in input) {
    if ((input.from && !isIso(input.from)) || (input.to && !isIso(input.to))) {
      return { ok: false, error: "invalid" };
    }
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (caseError || !caseRow) return { ok: false, error: "no_case" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  const language = profile?.preferred_language === "es" ? "es" : "en";
  const fullName = profile?.full_name ?? "";

  // Hand-picked set: empty selection → no rows, skip the query.
  if ("ids" in input && input.ids.length === 0) {
    return { ok: true, fullName, language, entries: [] };
  }

  // Chronological (oldest → newest) reads better in a report.
  let query = supabase
    .from("journal_entries")
    .select("*")
    .eq("case_id", caseRow.id)
    .order("created_at", { ascending: true });
  if ("ids" in input) {
    query = query.in("id", input.ids);
  } else {
    if (input.from) query = query.gte("created_at", input.from);
    if (input.to) query = query.lte("created_at", input.to);
  }

  const { data, error } = await query;
  if (error) return { ok: false, error: "generic" };

  return { ok: true, fullName, language, entries: (data as ReportRow[] | null) ?? [] };
}
