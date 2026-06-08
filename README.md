# Sana

A calm, bilingual companion that helps people document and track their accident, injuries, and recovery.

## Overview

Sana is a personal-injury companion app for people who were recently hurt in an accident and need to keep a clear record of what happened and how they are healing. It guides them through documenting their accident, logging daily pain and mood, marking where it hurts on an interactive body map, storing photos and PDFs, and tracking medical appointments, then turns that journal into a plain-language recovery summary. The interface is fully bilingual (English and Spanish) and every record is private to the person who created it.

## Tech Stack

- **Next.js 16** (App Router, TypeScript strict mode)
- **Tailwind CSS** with **shadcn/ui** (Radix primitives)
- **next-intl** for English/Spanish internationalization and locale-prefixed routing
- **Supabase** for authentication and Postgres with row-level security, plus Storage for document uploads (`@supabase/ssr`)
- **Claude API** (Anthropic) for the recovery summary, called from a server-only route
- **react-hook-form** + **Zod** for form validation
- **@react-pdf/renderer** for exportable journal reports
- Deployed to **Vercel**

## Key Features

- **Bilingual EN/ES** throughout, with locale-prefixed URLs and a language toggle that never mixes copy.
- **Accident and injury documentation** via a guided onboarding wizard and a daily journal capturing pain level, mood, locations, and free-text notes.
- **Interactive body map** for marking pain locations on a front/back human figure, rendered in plain-language labels in both languages.
- **AI recovery summary** that distills the journal into a short, warm, plain-language recap.
- **Document vault** for photos and PDFs (medical records, bills) with client-side image compression.
- **Appointment tracking** and a dashboard that surfaces the next appointment and latest recovery summary.
- **Secure per-user data** so each person sees only their own records.

## Tech Highlights

- **Row-level security as the real access control.** Auth runs through Supabase, and every table is protected by Postgres RLS policies keyed to the authenticated user, so a user can only read and write their own case, journal entries, documents, and summaries. The server clients use the public anon key and inherit the user's session; the privileged service-role key is never used in app code and never reaches the browser.
- **Server-only Claude summary endpoint.** The recovery summary lives at `app/api/summary/route.ts` (Node runtime). The Anthropic key is read from the server environment and never shipped to the client, raw model errors are never leaked back, the model is only called once the user has at least three journal entries, and results are cached in a `case_summaries` table so the dashboard does not re-call the model on every view. The model receives structured stats with verbatim notes, never document contents.
- **next-intl bilingual routing.** Routing is locale-prefixed (`always`) for `en` and `es`, and all user-facing copy lives in `messages/en.json` and `messages/es.json`. Region and mood labels live in a framework-neutral, dependency-free module so the same bilingual labels can be imported from both client components and the server summary route without tripping the "use client" boundary.
- **Body map built on a shared geometry/label core.** The `BodyPainMap` component, the journal list, and the PDF report all draw from the same region-label source and pain-severity color logic (`lib/pain.ts`), keeping the slider, badges, and figure consistent across the app.

## Running Locally

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.local.example` to `.env.local` and fill in your own values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=your-anthropic-api-key
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public by design (the anon key is gated by row-level security). `ANTHROPIC_API_KEY` is server-only and must never be prefixed with `NEXT_PUBLIC_`.

### 3. Set up the database

Create a Supabase project, then run the migrations in `supabase/migrations/` in filename order from the SQL editor (or via the Supabase CLI). They create the schema, the RLS policies, the new-user trigger, and the documents storage bucket.

### 4. Run the app

```bash
npm run dev        # start the dev server at http://localhost:3000
npm run dev:clean  # same, after clearing the .next cache
npm run build      # production build
npm run lint       # ESLint
```

Open <http://localhost:3000>. The app redirects to `/en` or `/es` based on the request locale.

### Sample data

The repository contains no real user data. The only sample records come from the synthetic end-to-end seed scripts in `e2e/` (for example, a `QA Bodymap` test user and a fabricated `car` accident), used to seed throwaway accounts for Playwright tests via the service role.

## Links

- **Live demo:** _coming soon_
- **Case study:** https://randall-portfolio-six.vercel.app/work/sana
