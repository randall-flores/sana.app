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
