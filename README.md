# Sana — Phase 1 Scaffold

Sana is a calm, bilingual (English + Spanish) companion app for people who just got injured in an accident. It helps them track their injury, their bills, and their case — in plain language, on their phone.

This repository contains the **Phase 1 scaffold**: Next.js 16 App Router, locale-prefixed routing, Supabase auth, an onboarding wizard, and an empty dashboard. Journal, Document Vault, and AI Coach features come in Phase 2.

## Tech stack

- **Next.js 16** (App Router, TypeScript strict mode)
- **Tailwind CSS** + **shadcn/ui**
- **Supabase** for auth, Postgres, and Storage (via `@supabase/ssr`)
- **next-intl** for English/Spanish routing and copy
- **react-hook-form** + **zod** for form validation
- **Lucide React** for icons
- Deployed to **Vercel**

## Project structure

```
app/                # Next.js App Router (locale-prefixed)
components/         # UI primitives, layout, onboarding
lib/                # supabase clients, i18n helpers, validation schemas
messages/           # en.json, es.json
supabase/           # SQL migrations (schema + RLS)
middleware.ts       # next-intl + Supabase session refresh
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. From **Project Settings → API**, copy your project URL, anon key, and service role key.
3. Copy `.env.local.example` to `.env.local` and fill the values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
4. Run the migrations under **SQL Editor** in the order listed:
   - `supabase/migrations/20260518000001_initial_schema.sql`
   - `supabase/migrations/20260518000002_rls_policies.sql`
   - `supabase/migrations/20260518000003_handle_new_user.sql`

### 3. Run the app

```bash
npm run dev
```

Open <http://localhost:3000>. The app redirects to `/en` (or `/es` based on browser language).

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import Project** from the repo.
3. Add the three environment variables from `.env.local` to the Vercel project.
4. Deploy. Vercel will auto-detect Next.js and build with the default settings.

## Adding translations

Every user-facing string lives in `messages/en.json` and `messages/es.json`. Never hardcode copy in components. Add new keys to both files and use `useTranslations("namespace")` (client) or `getTranslations` (server).

## What's intentionally not here yet

- Journal feature
- Document Vault (photo / PDF uploads)
- AI Coach
- Email magic links / OAuth providers
- Push notifications

These ship in Phase 2.
