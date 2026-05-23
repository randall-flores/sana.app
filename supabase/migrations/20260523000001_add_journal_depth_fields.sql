-- Add optional depth fields to journal_entries.
-- All nullable: a minimal entry (pain_level + notes) still saves.
alter table public.journal_entries
  add column if not exists pain_locations text[],   -- e.g. {'neck','lower_back'}
  add column if not exists pain_quality   text[],   -- e.g. {'sharp','burning'}
  add column if not exists daily_impact   text,     -- what the injury stopped them doing today
  add column if not exists mood           text,     -- single value: 'ok','anxious','frustrated','down'
  add column if not exists medications    text;      -- free text: what they took today
