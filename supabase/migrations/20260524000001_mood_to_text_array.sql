-- Make mood multi-select: single text -> text[].
-- Existing single values become single-element arrays; nulls stay null.
-- All stored values are current MOODS keys, so no data cleanup is needed.
alter table public.journal_entries
  alter column mood type text[]
  using case when mood is null then null else array[mood] end;
