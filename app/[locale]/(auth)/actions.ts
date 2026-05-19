"use server";

import { redirect } from "@/lib/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export type AuthState = { error?: string } | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "validation" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "invalid_credentials" };

  const locale = await getLocale();
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;

  let next: "onboarding" | "dashboard" = "onboarding";
  if (userId) {
    const { data: caseRow } = await supabase
      .from("cases")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (caseRow) next = "dashboard";
  }

  redirect({ href: `/${next}`, locale: locale as "en" | "es" });
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    preferredLanguage: formData.get("preferredLanguage"),
  });
  if (!parsed.success) return { error: "validation" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        preferred_language: parsed.data.preferredLanguage,
      },
    },
  });
  if (error || !data.user) return { error: "generic" };

  // The profiles row is created automatically by the handle_new_user trigger
  // (see supabase/migrations/20260518000003_handle_new_user.sql).

  redirect({ href: "/onboarding", locale: parsed.data.preferredLanguage });
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/", locale: locale as "en" | "es" });
}
