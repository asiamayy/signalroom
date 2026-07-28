-- Run this in Supabase SQL Editor
--
-- Broadcast users can now build a personal accent-color lineup instead of
-- only picking from the 8 built-in presets or a one-off custom hex: any
-- custom color chosen via the native picker is saved into brand_palette
-- (capped at 8, oldest evicted first), and up to 4 of those can be pinned
-- as brand_favorites for quick access. The report itself still only ever
-- uses the single active brand_color column, unchanged — the palette and
-- favorites are purely a saved-swatches convenience in Settings.

alter table public.profiles add column if not exists brand_palette jsonb;
alter table public.profiles add column if not exists brand_favorites jsonb;
