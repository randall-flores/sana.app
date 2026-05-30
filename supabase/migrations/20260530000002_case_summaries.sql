-- one stored summary per case, overwritten on regenerate
create table public.case_summaries (
  case_id                    uuid primary key
                             references public.cases(id) on delete cascade,
  summary_text               text not null,
  language                   text not null,   -- 'en' | 'es', the lang it was generated in
  entry_count_at_generation  integer not null default 0,
  generated_at               timestamptz not null default now()
);

alter table public.case_summaries enable row level security;

-- doc→case→user chain, same EXISTS pattern as journal_entries/documents
create policy summaries_select_own on public.case_summaries
  for select using (
    exists (select 1 from public.cases c
            where c.id = case_summaries.case_id and c.user_id = auth.uid())
  );

create policy summaries_insert_own on public.case_summaries
  for insert with check (
    exists (select 1 from public.cases c
            where c.id = case_summaries.case_id and c.user_id = auth.uid())
  );

-- UPDATE allowed here (unlike journal/documents) — regenerate overwrites
create policy summaries_update_own on public.case_summaries
  for update using (
    exists (select 1 from public.cases c
            where c.id = case_summaries.case_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.cases c
            where c.id = case_summaries.case_id and c.user_id = auth.uid())
  );

create policy summaries_delete_own on public.case_summaries
  for delete using (
    exists (select 1 from public.cases c
            where c.id = case_summaries.case_id and c.user_id = auth.uid())
  );
