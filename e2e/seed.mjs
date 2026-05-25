// Throwaway test-user seeding via Supabase service role. Run with:
//   node --env-file=.env.local e2e/seed.mjs            -> creates user, prints JSON creds
//   node --env-file=.env.local e2e/seed.mjs cleanup <uid> -> deletes the user (cascades profile)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [mode, uidArg] = process.argv.slice(2);

if (mode === "cleanup") {
  if (!uidArg) {
    console.error("cleanup needs a uid");
    process.exit(1);
  }
  const { error } = await admin.auth.admin.deleteUser(uidArg);
  if (error) {
    console.error("cleanup failed:", error.message);
    process.exit(1);
  }
  console.log("deleted " + uidArg);
  process.exit(0);
}

const email = `pw-bodymap+${Date.now()}@example.test`;
const password = "Test1234!pw";

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: "QA Bodymap", preferred_language: "en" },
});
if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}
const uid = data.user.id;

// The handle_new_user trigger creates the profile; upsert to be sure full_name is set.
await admin.from("profiles").upsert({ id: uid, full_name: "QA Bodymap", preferred_language: "en" });

console.log(JSON.stringify({ email, password, uid }));
