# e2e — responsive checks

Playwright suite for the journal body pain map. Seeds a throwaway Supabase user
(service role), drives the real dev server at 375 / 768 / 1280, in EN + ES.

## Run

```bash
# 1. seed a throwaway user (prints {email, password, uid})
node --env-file=.env.local e2e/seed.mjs

# 2. start the dev server (clean .next to avoid stale-build 404s)
npm run dev:clean

# 3. run the suite with the seeded creds
TEST_EMAIL=<email> TEST_PASSWORD=<password> BASE_URL=http://localhost:3000 npx playwright test
#   PowerShell: $env:TEST_EMAIL="..."; $env:TEST_PASSWORD="..."; npx playwright test

# 4. delete the throwaway user
node --env-file=.env.local e2e/seed.mjs cleanup <uid>
```

## Coverage (`body-map.spec.ts`)

- **375 EN** — map renders, tap region → `aria-pressed` + selected chip, List view toggle, no horizontal overflow.
- **375 ES** — Spanish hint/labels/chip, tap + List view, no overflow.
- **768 / 1280 EN** — map visible, tap → chip, no overflow.

`seed.mjs` relies on the `handle_new_user` trigger for the profile row; no `cases`
row is needed (the journal page renders for any authed user).
