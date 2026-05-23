-- notes is optional: a user in pain can save with just pain_level.
alter table public.journal_entries
  alter column notes drop not null;
