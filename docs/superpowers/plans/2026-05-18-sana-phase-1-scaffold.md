# Sana Phase 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundational bilingual (EN/ES) scaffold for Sana — a calm, mobile-first personal injury companion app — through working landing, auth, onboarding wizard, and dashboard placeholder, all backed by Supabase with RLS.

**Architecture:** Next.js 14 App Router with locale-prefixed routes (`/[locale]/...`) driven by next-intl. Supabase handles auth + Postgres + Storage via `@supabase/ssr` with a combined middleware that runs next-intl routing first, then Supabase session refresh. Server Actions handle auth and onboarding mutations. UI is built with shadcn/ui on a warm sage/coral palette with a Fraunces (display) + Inter (body) type pair loaded via `next/font`. All copy is in `/messages/{en,es}.json`. Database schema enforces row-level security so every user only ever touches their own data.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind CSS, shadcn/ui, @supabase/ssr, next-intl, lucide-react, react-hook-form + zod, Vercel.

---

## File Structure

This is what the repository should look like at the end of Phase 1:

```
sana/
├── app/
│   ├── layout.tsx                                   # root layout (HTML shell, redirect logic)
│   ├── page.tsx                                     # redirect helper for "/" → "/{locale}"
│   ├── globals.css                                  # Tailwind base + design tokens
│   ├── [locale]/
│   │   ├── layout.tsx                               # next-intl provider, fonts, AppShell
│   │   ├── page.tsx                                 # landing page
│   │   ├── (auth)/
│   │   │   ├── actions.ts                           # signIn / signUp / signOut server actions
│   │   │   ├── sign-in/page.tsx
│   │   │   └── sign-up/page.tsx
│   │   └── (dashboard)/
│   │       ├── layout.tsx                           # auth-gated layout
│   │       ├── dashboard/page.tsx
│   │       └── onboarding/
│   │           ├── page.tsx
│   │           └── actions.ts                       # saveOnboarding server action
│   └── auth/
│       └── callback/route.ts                        # Supabase OAuth/email callback
├── components/
│   ├── ui/                                          # shadcn primitives (button, input, card, ...)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── AppShell.tsx
│   │   ├── LocaleSwitcher.tsx
│   │   └── UserMenu.tsx
│   └── onboarding/
│       ├── OnboardingWizard.tsx
│       ├── Step1Accident.tsx
│       ├── Step2Feeling.tsx
│       └── Step3Attorney.tsx
├── lib/
│   ├── utils.ts                                     # shadcn cn()
│   ├── supabase/
│   │   ├── client.ts                                # browser client
│   │   ├── server.ts                                # RSC / Server Action client
│   │   └── middleware.ts                            # updateSession helper
│   ├── i18n/
│   │   ├── routing.ts                               # defineRouting()
│   │   ├── request.ts                               # getRequestConfig()
│   │   └── navigation.ts                            # localized Link / useRouter
│   └── validation/
│       ├── auth.ts                                  # zod schemas for sign-in/up
│       └── onboarding.ts                            # zod schemas for wizard
├── messages/
│   ├── en.json
│   └── es.json
├── supabase/
│   └── migrations/
│       ├── 20260518000001_initial_schema.sql
│       └── 20260518000002_rls_policies.sql
├── public/
│   └── (favicon, og image)
├── middleware.ts                                    # next-intl + Supabase combined
├── next.config.ts                                   # withNextIntl plugin
├── tailwind.config.ts                               # design tokens
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── .env.local.example
├── .gitignore
└── README.md
```

**Decomposition rationale:**
- Locale-prefixed routes (`/[locale]/...`) live under App Router; everything user-facing must be reachable in EN and ES.
- Auth and dashboard each have their own route group so the auth-gated `(dashboard)/layout.tsx` can server-side redirect anonymous users.
- Server Actions live alongside the pages that use them (`(auth)/actions.ts`, `onboarding/actions.ts`) so co-location is obvious.
- Supabase helpers are split into three files (`client.ts`, `server.ts`, `middleware.ts`) because each runs in a distinct execution context and the cookie handling differs.
- All zod schemas live under `lib/validation/` so server actions and forms share one source of truth.
- Migrations are split: schema first, then RLS policies, so they read cleanly and can be reasoned about independently.

---

## Task 1: Initialize Next.js in the current directory

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `next-env.d.ts`

- [ ] **Step 1: Run the Next.js installer in the current directory**

Run from `C:\Users\randa\Desktop\Projects\sana`:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```

Answer prompts:
- "Would you like to use Turbopack for `next dev`?" → Yes
- "Would you like to customize the default import alias?" → No (we already passed `@/*`)
- If asked "directory is not empty, continue?" → Yes (only `docs/` exists)

Expected: a working Next.js project rooted in `sana/`. `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `.gitignore`, `next-env.d.ts` exist.

- [ ] **Step 2: Verify the dev server boots**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with no errors, default Next.js landing page renders. Stop the server with Ctrl+C.

- [ ] **Step 3: Enable TypeScript strict mode**

Open `tsconfig.json` and confirm `"strict": true` is set under `compilerOptions`. If not, set it. Also confirm:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 4: Initialize git and make the bootstrap commit**

```bash
git init
git add -A
git commit -m "chore: bootstrap Next.js 14 App Router project"
```

---

## Task 2: Install runtime dependencies

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install Supabase, next-intl, lucide, forms, and zod**

```bash
npm install @supabase/supabase-js @supabase/ssr next-intl lucide-react react-hook-form @hookform/resolvers zod
```

Expected: install succeeds, `package.json` lists all six.

- [ ] **Step 2: Verify build still works**

```bash
npm run build
```

Expected: build succeeds with no type errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install runtime dependencies"
```

---

## Task 3: Initialize shadcn/ui with warm design tokens

**Files:**
- Create: `components.json`, `lib/utils.ts`, `components/ui/button.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`, `components/ui/card.tsx`, `components/ui/form.tsx`, `components/ui/radio-group.tsx`, `components/ui/slider.tsx`, `components/ui/textarea.tsx`, `components/ui/dropdown-menu.tsx`, `components/ui/select.tsx`, `components/ui/sonner.tsx`
- Modify: `app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init
```

Answer prompts:
- Style: **Default**
- Base color: **Neutral** (we will override with our own warm palette afterward)
- CSS variables: **Yes**

Expected: `components.json` and `lib/utils.ts` are created; `app/globals.css` is rewritten with shadcn CSS variables.

- [ ] **Step 2: Override CSS variables with the Sana warm palette**

Replace the entire contents of `app/globals.css` with:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 36 33% 97%;        /* #FAF8F5 cream */
    --foreground: 215 25% 17%;       /* #1F2937 charcoal */

    --card: 0 0% 100%;
    --card-foreground: 215 25% 17%;

    --popover: 0 0% 100%;
    --popover-foreground: 215 25% 17%;

    --primary: 182 25% 39%;          /* #4A7C7E sage teal */
    --primary-foreground: 36 33% 97%;

    --secondary: 36 24% 92%;         /* warm muted */
    --secondary-foreground: 215 25% 17%;

    --muted: 36 18% 92%;
    --muted-foreground: 215 14% 40%;

    --accent: 15 70% 61%;            /* #E07856 warm coral */
    --accent-foreground: 36 33% 97%;

    --destructive: 0 70% 50%;
    --destructive-foreground: 36 33% 97%;

    --border: 36 15% 86%;
    --input: 36 15% 86%;
    --ring: 182 25% 39%;

    --radius: 0.75rem;               /* rounded-xl default */
  }

  .dark {
    --background: 215 28% 12%;
    --foreground: 36 33% 97%;
    --card: 215 25% 16%;
    --card-foreground: 36 33% 97%;
    --popover: 215 25% 16%;
    --popover-foreground: 36 33% 97%;
    --primary: 182 30% 55%;
    --primary-foreground: 215 28% 12%;
    --secondary: 215 20% 22%;
    --secondary-foreground: 36 33% 97%;
    --muted: 215 20% 22%;
    --muted-foreground: 36 15% 70%;
    --accent: 15 75% 65%;
    --accent-foreground: 215 28% 12%;
    --destructive: 0 70% 55%;
    --destructive-foreground: 36 33% 97%;
    --border: 215 15% 25%;
    --input: 215 15% 25%;
    --ring: 182 30% 55%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground antialiased; }
  html { -webkit-tap-highlight-color: transparent; }
}
```

- [ ] **Step 3: Add the shadcn components we will need across Phase 1**

```bash
npx shadcn@latest add button input label card form radio-group slider textarea dropdown-menu select sonner
```

Expected: each component lands under `components/ui/`.

- [ ] **Step 4: Verify the install compiles**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with Sana warm design tokens"
```

---

## Task 4: Wire up display + body fonts via next/font

**Files:**
- Modify: `app/layout.tsx`
- Create: `lib/fonts.ts`

- [ ] **Step 1: Create the font helper**

Create `lib/fonts.ts`:

```ts
import { Fraunces, Inter } from "next/font/google";

export const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
```

- [ ] **Step 2: Register the font variables on `<html>`**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { fontBody, fontDisplay } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sana — Heal, remember, recover.",
  description:
    "A calm, bilingual companion that helps you track your injury, your bills, and your case after an accident.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <body className="font-body min-h-dvh bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Register the font families in Tailwind**

In `tailwind.config.ts`, ensure the theme extends with these font families (add to `theme.extend`):

```ts
fontFamily: {
  body: ["var(--font-body)", "system-ui", "sans-serif"],
  display: ["var(--font-display)", "Georgia", "serif"],
},
```

If `tailwind.config.ts` does not exist (Tailwind v4 may use CSS-only config), instead append the following to `app/globals.css` inside `@theme`:

```css
@theme {
  --font-body: var(--font-body);
  --font-display: var(--font-display);
}
```

- [ ] **Step 4: Verify**

```bash
npm run dev
```

Open `http://localhost:3000` and confirm fonts are loading (no FOUT). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire Fraunces display + Inter body fonts via next/font"
```

---

## Task 5: Add EN and ES message files

**Files:**
- Create: `messages/en.json`, `messages/es.json`

- [ ] **Step 1: Create `messages/en.json`**

```json
{
  "metadata": {
    "title": "Sana — Heal, remember, recover.",
    "description": "A calm, bilingual companion that helps you track your injury, your bills, and your case after an accident."
  },
  "common": {
    "appName": "Sana",
    "signIn": "Sign in",
    "signUp": "Sign up",
    "signOut": "Sign out",
    "continue": "Continue",
    "back": "Back",
    "finish": "Finish",
    "loading": "Loading…",
    "languageEn": "English",
    "languageEs": "Español"
  },
  "landing": {
    "heroTitle": "You got hurt. Sana helps you heal — and remember everything.",
    "heroSubtitle": "Track your injury, your bills, and your case — in your language.",
    "cta": "Get started — it's free",
    "features": {
      "documentTitle": "Document everything",
      "documentBody": "Photos, bills, reports — kept in one place, organized for you.",
      "recoveryTitle": "Track your recovery",
      "recoveryBody": "A simple daily check-in for pain, sleep, and how you feel.",
      "caseTitle": "Know what's happening with your case",
      "caseBody": "See where your claim stands, in plain language."
    }
  },
  "auth": {
    "signInTitle": "Welcome back",
    "signInSubtitle": "Sign in to continue your recovery.",
    "signUpTitle": "Create your account",
    "signUpSubtitle": "It only takes a minute.",
    "email": "Email",
    "password": "Password",
    "fullName": "Full name",
    "preferredLanguage": "Preferred language",
    "noAccount": "New here?",
    "hasAccount": "Already have an account?",
    "submitSignIn": "Sign in",
    "submitSignUp": "Create account",
    "errorGeneric": "Something went wrong. Please try again.",
    "errorInvalidCredentials": "Email or password is incorrect."
  },
  "onboarding": {
    "title": "Let's get you set up",
    "step": "Step {current} of {total}",
    "step1": {
      "title": "When did the accident happen?",
      "dateLabel": "Date of accident",
      "typeLabel": "What kind of accident was it?",
      "typeCar": "Car accident",
      "typeSlip": "Slip & fall",
      "typeOther": "Something else",
      "descriptionLabel": "A short description (optional)"
    },
    "step2": {
      "title": "How are you feeling right now?",
      "painLabel": "Pain level (1–10)",
      "notesLabel": "Anything you want to write down?",
      "notesPlaceholder": "Where it hurts, what helps, how you slept…"
    },
    "step3": {
      "title": "Do you already have a lawyer?",
      "yes": "Yes",
      "notYet": "Not yet",
      "notSure": "Not sure",
      "firmLabel": "Firm name (optional)"
    },
    "submit": "Finish setup"
  },
  "dashboard": {
    "greeting": "Hi {firstName}, how are you feeling today?",
    "journalTitle": "Your Journal",
    "documentsTitle": "Your Documents",
    "caseTitle": "Your Case Status",
    "comingSoon": "Coming soon"
  },
  "footer": {
    "tagline": "Sana — heal, remember, recover.",
    "copyright": "© {year} Sana"
  }
}
```

- [ ] **Step 2: Create `messages/es.json` with the same keys**

```json
{
  "metadata": {
    "title": "Sana — Sana, recuerda, recupérate.",
    "description": "Una compañera tranquila y bilingüe que te ayuda a registrar tu lesión, tus cuentas y tu caso después de un accidente."
  },
  "common": {
    "appName": "Sana",
    "signIn": "Iniciar sesión",
    "signUp": "Crear cuenta",
    "signOut": "Cerrar sesión",
    "continue": "Continuar",
    "back": "Atrás",
    "finish": "Terminar",
    "loading": "Cargando…",
    "languageEn": "English",
    "languageEs": "Español"
  },
  "landing": {
    "heroTitle": "Tuviste un accidente. Sana te acompaña mientras te recuperas.",
    "heroSubtitle": "Registra tu lesión, tus cuentas y tu caso — en tu idioma.",
    "cta": "Comenzar — es gratis",
    "features": {
      "documentTitle": "Documenta todo",
      "documentBody": "Fotos, cuentas, reportes — todo en un solo lugar, organizado para ti.",
      "recoveryTitle": "Sigue tu recuperación",
      "recoveryBody": "Un chequeo diario sencillo: dolor, sueño y cómo te sientes.",
      "caseTitle": "Sabe qué pasa con tu caso",
      "caseBody": "Mira dónde va tu reclamo, en palabras claras."
    }
  },
  "auth": {
    "signInTitle": "Bienvenido de vuelta",
    "signInSubtitle": "Inicia sesión para continuar tu recuperación.",
    "signUpTitle": "Crea tu cuenta",
    "signUpSubtitle": "Solo toma un minuto.",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "fullName": "Nombre completo",
    "preferredLanguage": "Idioma preferido",
    "noAccount": "¿Eres nuevo?",
    "hasAccount": "¿Ya tienes cuenta?",
    "submitSignIn": "Iniciar sesión",
    "submitSignUp": "Crear cuenta",
    "errorGeneric": "Algo salió mal. Por favor intenta de nuevo.",
    "errorInvalidCredentials": "El correo o la contraseña no son correctos."
  },
  "onboarding": {
    "title": "Vamos a configurarte",
    "step": "Paso {current} de {total}",
    "step1": {
      "title": "¿Cuándo fue el accidente?",
      "dateLabel": "Fecha del accidente",
      "typeLabel": "¿Qué tipo de accidente fue?",
      "typeCar": "Accidente de auto",
      "typeSlip": "Resbalón o caída",
      "typeOther": "Otra cosa",
      "descriptionLabel": "Una descripción breve (opcional)"
    },
    "step2": {
      "title": "¿Cómo te sientes ahora?",
      "painLabel": "Nivel de dolor (1–10)",
      "notesLabel": "¿Algo que quieras anotar?",
      "notesPlaceholder": "Dónde te duele, qué te ayuda, cómo dormiste…"
    },
    "step3": {
      "title": "¿Ya tienes abogado?",
      "yes": "Sí",
      "notYet": "Todavía no",
      "notSure": "No estoy seguro",
      "firmLabel": "Nombre del bufete (opcional)"
    },
    "submit": "Terminar configuración"
  },
  "dashboard": {
    "greeting": "Hola {firstName}, ¿cómo te sientes hoy?",
    "journalTitle": "Tu diario",
    "documentsTitle": "Tus documentos",
    "caseTitle": "Estado de tu caso",
    "comingSoon": "Próximamente"
  },
  "footer": {
    "tagline": "Sana — sana, recuerda, recupérate.",
    "copyright": "© {year} Sana"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/
git commit -m "feat: add EN and ES message catalogs"
```

---

## Task 6: Configure next-intl routing

**Files:**
- Create: `lib/i18n/routing.ts`, `lib/i18n/navigation.ts`, `lib/i18n/request.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Create the routing config**

Create `lib/i18n/routing.ts`:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
```

- [ ] **Step 2: Create the localized navigation helpers**

Create `lib/i18n/navigation.ts`:

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 3: Create the request config**

Create `lib/i18n/request.ts`:

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Wire next-intl into `next.config.ts`**

Replace `next.config.ts` with:

```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure next-intl routing for EN and ES"
```

---

## Task 7: Restructure routes under /[locale]

**Files:**
- Delete: `app/page.tsx` (the default Next.js landing page)
- Modify: `app/layout.tsx`
- Create: `app/[locale]/layout.tsx`, `app/[locale]/page.tsx`

- [ ] **Step 1: Strip the root layout down so it does not declare `<html>` twice**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sana",
  description: "Heal, remember, recover.",
};

// The actual <html>/<body> live in app/[locale]/layout.tsx because the lang attribute
// must reflect the active locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: Delete the legacy root landing page**

```bash
rm app/page.tsx
```

- [ ] **Step 3: Create the locale layout**

Create `app/[locale]/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { fontBody, fontDisplay } from "@/lib/fonts";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${fontBody.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <body className="font-body min-h-dvh bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create a temporary locale landing so routing works**

Create `app/[locale]/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Hero />;
}

function Hero() {
  const t = useTranslations("landing");
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <h1 className="font-display text-4xl">{t("heroTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("heroSubtitle")}</p>
    </main>
  );
}
```

(We will replace this with the full landing in Task 12.)

- [ ] **Step 5: Verify both locales render**

```bash
npm run dev
```

Visit `http://localhost:3000/en` and `http://localhost:3000/es` — both should render translated copy. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold locale-prefixed App Router structure"
```

---

## Task 8: Create Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `.env.local.example`
- Modify: `.gitignore`

- [ ] **Step 1: Browser client**

Create `lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Server client (RSC + Server Actions)**

Create `lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — middleware refresh handles it.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Middleware session refresher**

Create `lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    },
  );

  // Touch getUser() so the session refresh cookie is rewritten when needed.
  await supabase.auth.getUser();

  return response;
}
```

- [ ] **Step 4: Create `.env.local.example`**

Create `.env.local.example`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 5: Ensure `.env.local` is gitignored**

Open `.gitignore`. Confirm these lines exist (Next.js usually adds them, but verify):

```
.env*.local
.env
```

If missing, add them.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client helpers and env example"
```

---

## Task 9: Combined middleware (next-intl + Supabase)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write the middleware**

Create `middleware.ts` at the repo root:

```ts
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // Skip middleware on the Supabase auth callback so the code exchange runs unmodified.
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // 1. Run next-intl first — it produces the response (with locale rewrites/redirects).
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect, propagate it as-is.
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2. Refresh the Supabase session on the same response so cookies are kept in sync.
  return updateSupabaseSession(request, intlResponse);
}

export const config = {
  matcher: [
    // Everything except Next internals, static files, and the auth callback.
    "/((?!_next|api|.*\\..*|auth/callback).*)",
  ],
};
```

- [ ] **Step 2: Verify middleware runs**

```bash
npm run dev
```

Visit `http://localhost:3000/` — it should redirect to `/en`. Visit `http://localhost:3000/es` and confirm Spanish renders. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: combine next-intl routing with Supabase session refresh"
```

---

## Task 10: Validation schemas

**Files:**
- Create: `lib/validation/auth.ts`, `lib/validation/onboarding.ts`

- [ ] **Step 1: Auth schemas**

Create `lib/validation/auth.ts`:

```ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUpSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8),
  preferredLanguage: z.enum(["en", "es"]),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
```

- [ ] **Step 2: Onboarding schema**

Create `lib/validation/onboarding.ts`:

```ts
import { z } from "zod";

export const accidentTypeEnum = z.enum(["car", "slip", "other"]);
export const hasAttorneyEnum = z.enum(["yes", "not_yet", "not_sure"]);

export const onboardingSchema = z.object({
  accidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accidentType: accidentTypeEnum,
  accidentDescription: z.string().max(2000).optional().default(""),
  painLevel: z.number().int().min(1).max(10),
  notes: z.string().max(4000).optional().default(""),
  hasAttorney: hasAttorneyEnum,
  attorneyFirmName: z.string().max(200).optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
```

- [ ] **Step 3: Commit**

```bash
git add lib/validation
git commit -m "feat: add zod schemas for auth and onboarding"
```

---

## Task 11: Layout components

**Files:**
- Create: `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`, `components/layout/AppShell.tsx`, `components/layout/LocaleSwitcher.tsx`, `components/layout/UserMenu.tsx`

- [ ] **Step 1: LocaleSwitcher**

Create `components/layout/LocaleSwitcher.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/lib/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { routing } from "@/lib/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: "en" | "es") => {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2" aria-label="Change language" disabled={isPending}>
          <Languages className="h-4 w-4" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => switchTo(l)} disabled={l === locale}>
            {l === "en" ? t("languageEn") : t("languageEs")}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 2: UserMenu**

Create `components/layout/UserMenu.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/[locale]/(auth)/actions";

export function UserMenu({ email }: { email: string }) {
  const t = useTranslations("common");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="User menu" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[14ch] truncate">{email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 3: Navbar**

Create `components/layout/Navbar.tsx`:

```tsx
import { Link } from "@/lib/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UserMenu } from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function Navbar({ userEmail }: { userEmail?: string }) {
  const t = useTranslations("common");
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-display text-xl text-primary">
          Sana
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {userEmail ? (
            <UserMenu email={userEmail} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/sign-in">{t("signIn")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/sign-up">{t("signUp")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Footer**

Create `components/layout/Footer.tsx`:

```tsx
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-border/60 py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-1 px-4 sm:flex-row sm:justify-between">
        <p className="font-display">{t("tagline")}</p>
        <p>{t("copyright", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 5: AppShell**

Create `components/layout/AppShell.tsx`:

```tsx
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar userEmail={userEmail} />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
```

- [ ] **Step 6: Wire AppShell into the locale layout**

Replace the entire contents of `app/[locale]/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { fontBody, fontDisplay } from "@/lib/fonts";
import { AppShell } from "@/components/layout/AppShell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang={locale} className={`${fontBody.variable} ${fontDisplay.variable}`} suppressHydrationWarning>
      <body className="font-body min-h-dvh bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>
          <AppShell userEmail={user?.email}>{children}</AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: Verify**

```bash
npm run dev
```

Visit `/en` and `/es`. Locale switcher should swap languages and Navbar/Footer should render. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add Navbar, Footer, LocaleSwitcher, UserMenu, AppShell"
```

---

## Task 12: Landing page

**Files:**
- Modify: `app/[locale]/page.tsx`

- [ ] **Step 1: Build the full landing**

Replace `app/[locale]/page.tsx` with:

```tsx
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { FileText, HeartPulse, Scale, ArrowRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LandingContent />;
}

function LandingContent() {
  const t = useTranslations("landing");
  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]"
        />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
          <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 text-base">
              <Link href="/sign-up">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<FileText className="h-5 w-5 text-primary" />}
            title={t("features.documentTitle")}
            body={t("features.documentBody")}
          />
          <FeatureCard
            icon={<HeartPulse className="h-5 w-5 text-primary" />}
            title={t("features.recoveryTitle")}
            body={t("features.recoveryBody")}
          />
          <FeatureCard
            icon={<Scale className="h-5 w-5 text-primary" />}
            title={t("features.caseTitle")}
            body={t("features.caseBody")}
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="rounded-xl border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="rounded-lg bg-primary/10 p-2">{icon}</span>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{body}</CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npm run dev
```

Visit `/en` and `/es`. Confirm hero, three feature cards, and CTA all translate. Stop the server.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat: build calm bilingual landing page"
```

---

## Task 13: Auth Server Actions

**Files:**
- Create: `app/[locale]/(auth)/actions.ts`

- [ ] **Step 1: Implement signIn / signUp / signOut**

Create `app/[locale]/(auth)/actions.ts`:

```ts
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

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    preferred_language: parsed.data.preferredLanguage,
  });
  if (profileError) return { error: "generic" };

  redirect({ href: "/onboarding", locale: parsed.data.preferredLanguage });
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/", locale: locale as "en" | "es" });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(auth\)/actions.ts
git commit -m "feat: server actions for sign-in, sign-up, sign-out"
```

---

## Task 14: Sign-in page

**Files:**
- Create: `app/[locale]/(auth)/sign-in/page.tsx`

- [ ] **Step 1: Build the page**

Create `app/[locale]/(auth)/sign-in/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { signIn, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signIn, undefined);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md items-center px-6 py-12">
      <Card className="w-full rounded-xl border-border/70 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{t("signInTitle")}</CardTitle>
          <CardDescription>{t("signInSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" minLength={8} />
            </div>
            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error === "invalid_credentials" ? t("errorInvalidCredentials") : t("errorGeneric")}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {t("submitSignIn")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                {t("submitSignUp")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(auth\)/sign-in
git commit -m "feat: sign-in page wired to Server Action"
```

---

## Task 15: Sign-up page

**Files:**
- Create: `app/[locale]/(auth)/sign-up/page.tsx`

- [ ] **Step 1: Build the page**

Create `app/[locale]/(auth)/sign-up/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/navigation";
import { signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md items-center px-6 py-12">
      <Card className="w-full rounded-xl border-border/70 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">{t("signUpTitle")}</CardTitle>
          <CardDescription>{t("signUpSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input id="fullName" name="fullName" required autoComplete="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">{t("preferredLanguage")}</Label>
              <Select name="preferredLanguage" defaultValue={locale}>
                <SelectTrigger id="preferredLanguage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{tc("languageEn")}</SelectItem>
                  <SelectItem value="es">{tc("languageEs")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {state?.error && (
              <p role="alert" className="text-sm text-destructive">
                {t("errorGeneric")}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={pending}>
              {t("submitSignUp")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
                {t("submitSignIn")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(auth\)/sign-up
git commit -m "feat: sign-up page with preferred language"
```

---

## Task 16: Auth-gated dashboard layout

**Files:**
- Create: `app/[locale]/(dashboard)/layout.tsx`

- [ ] **Step 1: Server-side redirect anonymous visitors**

Create `app/[locale]/(dashboard)/layout.tsx`:

```tsx
import { redirect } from "@/lib/i18n/navigation";
import { getLocale } from "next-intl/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    redirect({ href: "/sign-in", locale: locale as "en" | "es" });
  }
  return children;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(dashboard\)/layout.tsx
git commit -m "feat: auth-gated layout for dashboard routes"
```

---

## Task 17: Onboarding Server Action

**Files:**
- Create: `app/[locale]/(dashboard)/onboarding/actions.ts`

- [ ] **Step 1: Implement saveOnboarding**

Create `app/[locale]/(dashboard)/onboarding/actions.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(dashboard\)/onboarding/actions.ts
git commit -m "feat: onboarding server action saves case + first journal entry"
```

---

## Task 18: Onboarding wizard — step components

**Files:**
- Create: `components/onboarding/Step1Accident.tsx`, `components/onboarding/Step2Feeling.tsx`, `components/onboarding/Step3Attorney.tsx`

- [ ] **Step 1: Step 1 — accident info**

Create `components/onboarding/Step1Accident.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Car, Footprints, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "accidentDate" | "accidentType" | "accidentDescription">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step1Accident({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step1");
  const options = [
    { id: "car", label: t("typeCar"), icon: Car },
    { id: "slip", label: t("typeSlip"), icon: Footprints },
    { id: "other", label: t("typeOther"), icon: HelpCircle },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <div className="space-y-2">
        <Label htmlFor="accidentDate">{t("dateLabel")}</Label>
        <Input
          id="accidentDate"
          type="date"
          required
          value={value.accidentDate}
          onChange={(e) => onChange({ accidentDate: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>{t("typeLabel")}</Label>
        <RadioGroup
          value={value.accidentType}
          onValueChange={(v) => onChange({ accidentType: v as OnboardingInput["accidentType"] })}
          className="grid gap-3 sm:grid-cols-3"
        >
          {options.map(({ id, label, icon: Icon }) => (
            <Label
              key={id}
              htmlFor={`type-${id}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-4 transition hover:border-primary/60 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
            >
              <RadioGroupItem id={`type-${id}`} value={id} className="sr-only" />
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm">{label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accidentDescription">{t("descriptionLabel")}</Label>
        <Textarea
          id="accidentDescription"
          rows={3}
          value={value.accidentDescription}
          onChange={(e) => onChange({ accidentDescription: e.target.value })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Step 2 — feeling**

Create `components/onboarding/Step2Feeling.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "painLevel" | "notes">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step2Feeling({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step2");
  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="painLevel">{t("painLabel")}</Label>
          <span className="font-display text-2xl text-primary">{value.painLevel}</span>
        </div>
        <Slider
          id="painLevel"
          min={1}
          max={10}
          step={1}
          value={[value.painLevel]}
          onValueChange={([n]) => onChange({ painLevel: n })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notesLabel")}</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder={t("notesPlaceholder")}
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Step 3 — attorney**

Create `components/onboarding/Step3Attorney.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OnboardingInput } from "@/lib/validation/onboarding";

type Props = {
  value: Pick<OnboardingInput, "hasAttorney" | "attorneyFirmName">;
  onChange: (patch: Partial<OnboardingInput>) => void;
};

export function Step3Attorney({ value, onChange }: Props) {
  const t = useTranslations("onboarding.step3");
  const options = [
    { id: "yes", label: t("yes") },
    { id: "not_yet", label: t("notYet") },
    { id: "not_sure", label: t("notSure") },
  ] as const;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl">{t("title")}</h2>

      <RadioGroup
        value={value.hasAttorney}
        onValueChange={(v) => onChange({ hasAttorney: v as OnboardingInput["hasAttorney"] })}
        className="grid gap-3"
      >
        {options.map(({ id, label }) => (
          <Label
            key={id}
            htmlFor={`atty-${id}`}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-4 transition hover:border-primary/60 has-[input:checked]:border-primary has-[input:checked]:bg-primary/5"
          >
            <RadioGroupItem id={`atty-${id}`} value={id} className="sr-only" />
            <span className="text-sm">{label}</span>
          </Label>
        ))}
      </RadioGroup>

      {value.hasAttorney === "yes" && (
        <div className="space-y-2">
          <Label htmlFor="attorneyFirmName">{t("firmLabel")}</Label>
          <Input
            id="attorneyFirmName"
            value={value.attorneyFirmName}
            onChange={(e) => onChange({ attorneyFirmName: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/onboarding
git commit -m "feat: onboarding step components"
```

---

## Task 19: Onboarding wizard shell + page

**Files:**
- Create: `components/onboarding/OnboardingWizard.tsx`, `app/[locale]/(dashboard)/onboarding/page.tsx`

- [ ] **Step 1: Wizard shell**

Create `components/onboarding/OnboardingWizard.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Step1Accident } from "./Step1Accident";
import { Step2Feeling } from "./Step2Feeling";
import { Step3Attorney } from "./Step3Attorney";
import { saveOnboarding } from "@/app/[locale]/(dashboard)/onboarding/actions";
import type { OnboardingInput } from "@/lib/validation/onboarding";

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingInput>({
    accidentDate: "",
    accidentType: "car",
    accidentDescription: "",
    painLevel: 5,
    notes: "",
    hasAttorney: "not_sure",
    attorneyFirmName: "",
  });

  const patch = (p: Partial<OnboardingInput>) => setData((d) => ({ ...d, ...p }));

  const onNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const onBack = () => setStep((s) => Math.max(s - 1, 1));
  const onSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveOnboarding(data);
      if (result && result.ok === false) setError(result.error);
    });
  };

  const canAdvance =
    (step === 1 && data.accidentDate && data.accidentType) ||
    (step === 2 && data.painLevel >= 1 && data.painLevel <= 10) ||
    step === 3;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Card className="rounded-xl border-border/70 shadow-sm">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("step", { current: step, total: TOTAL_STEPS })}
            </p>
            <div className="h-1.5 w-full rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && <Step1Accident value={data} onChange={patch} />}
          {step === 2 && <Step2Feeling value={data} onChange={patch} />}
          {step === 3 && <Step3Attorney value={data} onChange={patch} />}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onBack} disabled={step === 1 || pending}>
              {tc("back")}
            </Button>
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={onNext} disabled={!canAdvance || pending}>
                {tc("continue")}
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={pending}>
                {t("submit")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Onboarding page**

Create `app/[locale]/(dashboard)/onboarding/page.tsx`:

```tsx
import { setRequestLocale } from "next-intl/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <OnboardingWizard />;
}
```

- [ ] **Step 3: Commit**

```bash
git add components/onboarding/OnboardingWizard.tsx app/[locale]/\(dashboard\)/onboarding/page.tsx
git commit -m "feat: 3-step onboarding wizard"
```

---

## Task 20: Dashboard placeholder

**Files:**
- Create: `app/[locale]/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Build the dashboard**

Create `app/[locale]/(dashboard)/dashboard/page.tsx`:

```tsx
import { setRequestLocale, getTranslations } from "next-intl/server";
import { BookOpen, FolderOpen, Scale } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .maybeSingle();

  const t = await getTranslations("dashboard");
  const firstName = (profile?.full_name ?? "").split(" ")[0] ?? "";

  const placeholders = [
    { icon: BookOpen, title: t("journalTitle") },
    { icon: FolderOpen, title: t("documentsTitle") },
    { icon: Scale, title: t("caseTitle") },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl">{t("greeting", { firstName })}</h1>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {placeholders.map(({ icon: Icon, title }) => (
          <Card key={title} className="rounded-xl border-border/70 shadow-sm">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <span className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-5 w-5 text-primary" />
              </span>
              <CardTitle className="font-display text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{t("comingSoon")}</CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/\(dashboard\)/dashboard/page.tsx
git commit -m "feat: dashboard placeholder with three coming-soon cards"
```

---

## Task 21: Supabase auth callback route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Add the route**

Create `app/auth/callback/route.ts`:

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/en/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: Supabase auth callback route"
```

---

## Task 22: Database schema migration

**Files:**
- Create: `supabase/migrations/20260518000001_initial_schema.sql`

- [ ] **Step 1: Write the schema**

Create `supabase/migrations/20260518000001_initial_schema.sql`:

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  created_at timestamptz not null default now()
);

-- cases
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  accident_date date not null,
  accident_type text not null check (accident_type in ('car', 'slip', 'other')),
  accident_description text not null default '',
  has_attorney text not null check (has_attorney in ('yes', 'not_yet', 'not_sure')),
  attorney_firm_name text not null default '',
  status text not null default 'intake',
  created_at timestamptz not null default now()
);

create index if not exists cases_user_id_idx on public.cases (user_id);

-- journal_entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  pain_level int not null check (pain_level between 1 and 10),
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_case_id_idx on public.journal_entries (case_id);
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260518000001_initial_schema.sql
git commit -m "feat(db): initial schema for profiles, cases, journal_entries"
```

---

## Task 23: Row-Level Security policies

**Files:**
- Create: `supabase/migrations/20260518000002_rls_policies.sql`

- [ ] **Step 1: Write the policies**

Create `supabase/migrations/20260518000002_rls_policies.sql`:

```sql
alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.journal_entries enable row level security;

-- profiles: each user only sees and edits their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- cases: each user only sees and edits their own cases
create policy "cases_select_own"
  on public.cases for select
  using (auth.uid() = user_id);

create policy "cases_insert_self"
  on public.cases for insert
  with check (auth.uid() = user_id);

create policy "cases_update_own"
  on public.cases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "cases_delete_own"
  on public.cases for delete
  using (auth.uid() = user_id);

-- journal_entries: scoped through the parent case
create policy "journal_select_own"
  on public.journal_entries for select
  using (
    exists (
      select 1 from public.cases c
      where c.id = journal_entries.case_id and c.user_id = auth.uid()
    )
  );

create policy "journal_insert_own"
  on public.journal_entries for insert
  with check (
    exists (
      select 1 from public.cases c
      where c.id = journal_entries.case_id and c.user_id = auth.uid()
    )
  );

create policy "journal_update_own"
  on public.journal_entries for update
  using (
    exists (
      select 1 from public.cases c
      where c.id = journal_entries.case_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.cases c
      where c.id = journal_entries.case_id and c.user_id = auth.uid()
    )
  );

create policy "journal_delete_own"
  on public.journal_entries for delete
  using (
    exists (
      select 1 from public.cases c
      where c.id = journal_entries.case_id and c.user_id = auth.uid()
    )
  );
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260518000002_rls_policies.sql
git commit -m "feat(db): RLS policies on profiles, cases, journal_entries"
```

---

## Task 24: README and project docs

**Files:**
- Create/Modify: `README.md`

- [ ] **Step 1: Write the README**

Overwrite `README.md` with:

````markdown
# Sana — Phase 1 Scaffold

Sana is a calm, bilingual (English + Spanish) companion app for people who just got injured in an accident. It helps them track their injury, their bills, and their case — in plain language, on their phone.

This repository contains the **Phase 1 scaffold**: Next.js 14 App Router, locale-prefixed routing, Supabase auth, an onboarding wizard, and an empty dashboard. Journal, Document Vault, and AI Coach features come in Phase 2.

## Tech stack

- **Next.js 14** (App Router, TypeScript strict mode)
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
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project README with setup, structure, and deploy notes"
```

---

## Task 25: Final verification + done-checklist commit

**Files:**
- (no new files)

- [ ] **Step 1: Type-check and lint**

```bash
npm run lint
npx tsc --noEmit
```

Expected: both pass with zero errors. Fix any issues that surface.

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: build succeeds, both locales statically generated for the landing page.

- [ ] **Step 3: Manual smoke test against a real Supabase project**

With `.env.local` populated and migrations applied, run:

```bash
npm run dev
```

Walk through this checklist in the browser:

- [ ] `/` redirects to `/en` or `/es` based on browser language.
- [ ] Landing renders translated copy in both `/en` and `/es`; locale switcher swaps without losing the route.
- [ ] `/en/sign-up` creates an account; a row appears in `auth.users` and `public.profiles`.
- [ ] After sign-up, the app lands on `/{locale}/onboarding`.
- [ ] Completing the 3-step wizard creates one `cases` row and one `journal_entries` row scoped to the user.
- [ ] Wizard finish redirects to `/{locale}/dashboard`, which greets the user by first name.
- [ ] Sign-out clears the session and returns to the landing page.
- [ ] Signing back in with an existing user with a case goes straight to `/dashboard`; a user with no case goes to `/onboarding`.
- [ ] Querying `cases` from a different Supabase user only returns that user's rows (RLS check).
- [ ] No hardcoded strings appear in components (spot-check via `grep`).

- [ ] **Step 4: Polish commit (only if smoke test surfaced fixes)**

If any fixes were needed during smoke testing:

```bash
git add -A
git commit -m "chore: phase 1 scaffold polish from manual QA"
```

Otherwise skip this step.

- [ ] **Step 5: Squash to one clean initial commit**

The spec asks for a single clean initial commit titled `Initial scaffold: Sana MVP Phase 1`. Per-task commits during execution made review easy; now collapse them.

Confirm there are no remote refs (the spec forbids pushing). Then:

```bash
git reset $(git commit-tree HEAD^{tree} -m "Initial scaffold: Sana MVP Phase 1")
```

This resets the branch pointer to a single new commit whose tree matches the current working tree, discarding all intermediate commits while preserving every file.

Verify:

```bash
git log --oneline
git status
```

Expected: exactly one commit (`Initial scaffold: Sana MVP Phase 1`); working tree clean.

- [ ] **Step 6: Do NOT push**

Do not push to a remote. The user will connect their own GitHub repo.

---

## Done

When every checkbox above is checked, Phase 1 is complete. The repo should boot, sign up, onboard, and land on a dashboard — in two languages — backed by a Postgres schema that won't leak data between users.

Phase 2 work (Journal, Document Vault, AI Coach) lives in separate plans.
