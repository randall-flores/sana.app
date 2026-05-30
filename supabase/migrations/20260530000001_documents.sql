-- documents table: chains doc -> case -> user, mirroring journal_entries
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  storage_path text not null unique,          -- {user_id}/{case_id}/{uuid}.{ext}
  file_name    text not null,                 -- original name, for display
  mime_type    text not null,
  file_size    bigint not null,
  created_at   timestamptz not null default now()
);

alter table public.documents enable row level security;

-- no UPDATE policy: documents are immutable evidence, same as journal entries
create policy documents_select_own on public.documents
  for select using (
    exists (select 1 from public.cases c
            where c.id = documents.case_id and c.user_id = auth.uid())
  );

create policy documents_insert_own on public.documents
  for insert with check (
    exists (select 1 from public.cases c
            where c.id = documents.case_id and c.user_id = auth.uid())
  );

create policy documents_delete_own on public.documents
  for delete using (
    exists (select 1 from public.cases c
            where c.id = documents.case_id and c.user_id = auth.uid())
  );

-- private bucket, 10 MB cap, phone-friendly types
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents', 'case-documents', false, 10485760,
  array['image/jpeg','image/png','image/heic','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- storage policies: scope objects to the user's own top folder
-- path convention: {user_id}/{case_id}/{filename}
create policy "case docs select own" on storage.objects
  for select using (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "case docs insert own" on storage.objects
  for insert with check (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "case docs delete own" on storage.objects
  for delete using (
    bucket_id = 'case-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
