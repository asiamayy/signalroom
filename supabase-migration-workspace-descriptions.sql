-- Run this in the Supabase SQL Editor.
-- Adds the optional, member-visible description shown on each workspace card.

alter table public.workspaces
  add column if not exists description text;

alter table public.workspaces
  drop constraint if exists workspaces_description_length;

alter table public.workspaces
  add constraint workspaces_description_length
  check (description is null or char_length(description) <= 360);
