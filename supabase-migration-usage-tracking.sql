-- Run this in Supabase SQL Editor
-- Lifetime usage counters (profiles.interviews_used / personas_used were
-- previously dead columns). API routes call these RPCs after a successful
-- creation, so counts are maintained atomically in Postgres — the client
-- never supplies them.

create or replace function public.increment_interviews_used()
returns void
language sql
as $$
  update public.profiles set interviews_used = interviews_used + 1 where id = auth.uid();
$$;

create or replace function public.increment_personas_used()
returns void
language sql
as $$
  update public.profiles set personas_used = personas_used + 1 where id = auth.uid();
$$;

-- Cleanup: an earlier revision of this migration also added per-day AI
-- message metering, which was removed from the product (plan limits are
-- product-based, not message-based). If you ran that revision, the
-- statements below remove its leftovers; they are no-ops otherwise.
drop function if exists public.increment_ai_messages(integer);
alter table public.profiles drop column if exists ai_messages_today;
alter table public.profiles drop column if exists ai_messages_date;
