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
