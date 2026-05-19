"use server";

import { redirect } from "@/lib/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/onboarding";

export async function saveOnboarding(input: OnboardingInput) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "validation" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" };

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .insert({
      user_id: user.id,
      accident_date: parsed.data.accidentDate,
      accident_type: parsed.data.accidentType,
      accident_description: parsed.data.accidentDescription,
      has_attorney: parsed.data.hasAttorney,
      attorney_firm_name: parsed.data.attorneyFirmName,
      status: "intake",
    })
    .select("id")
    .single();
  if (caseError || !caseRow) return { ok: false as const, error: "generic" };

  const { error: journalError } = await supabase.from("journal_entries").insert({
    case_id: caseRow.id,
    pain_level: parsed.data.painLevel,
    notes: parsed.data.notes,
  });
  if (journalError) return { ok: false as const, error: "generic" };

  const locale = await getLocale();
  redirect({ href: "/dashboard", locale: locale as "en" | "es" });
}
