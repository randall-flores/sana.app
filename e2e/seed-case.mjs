// Test helper: insert a cases row for an already-seeded user (service role,
// bypasses RLS). Usage: node --env-file=.env.local e2e/seed-case.mjs <uid>
import { createClient } from "@supabase/supabase-js";

const uid = process.argv[2];
if (!uid) {
  console.error("usage: seed-case.mjs <uid>");
  process.exit(1);
}
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const { data, error } = await admin
  .from("cases")
  .insert({
    user_id: uid,
    accident_date: "2026-05-01",
    accident_type: "car",
    has_attorney: "not_yet",
    status: "intake",
  })
  .select("id")
  .single();
if (error) {
  console.error("case insert failed:", error.message);
  process.exit(1);
}
console.log(data.id);
