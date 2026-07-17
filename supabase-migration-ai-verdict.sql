-- Run this in Supabase SQL Editor
alter table public.reports add column if not exists ai_verdict jsonb;
