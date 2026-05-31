create table public.appointments (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  title        text not null,
  appt_at      timestamptz not null,          -- date + time of the appointment
  appt_type    text not null default 'other', -- medical | pt | legal | other
  location     text not null default '',      -- optional, free text
  notes        text not null default '',      -- optional
  created_at   timestamptz not null default now()
);

alter table public.appointments enable row level security;

-- doc→case→user chain, same EXISTS pattern as journal_entries/documents.
-- HAS update (unlike documents) — an appointment can be edited/rescheduled.
create policy appts_select_own on public.appointments
  for select using (
    exists (select 1 from public.cases c
            where c.id = appointments.case_id and c.user_id = auth.uid())
  );
create policy appts_insert_own on public.appointments
  for insert with check (
    exists (select 1 from public.cases c
            where c.id = appointments.case_id and c.user_id = auth.uid())
  );
create policy appts_update_own on public.appointments
  for update using (
    exists (select 1 from public.cases c
            where c.id = appointments.case_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.cases c
            where c.id = appointments.case_id and c.user_id = auth.uid())
  );
create policy appts_delete_own on public.appointments
  for delete using (
    exists (select 1 from public.cases c
            where c.id = appointments.case_id and c.user_id = auth.uid())
  );
