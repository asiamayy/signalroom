-- Run this in Supabase SQL Editor
--
-- Slack + Notion integrations (Signal/pro and Broadcast/agency plans only —
-- gated by PLAN_LIMITS.integrations_enabled, checked in every route, never
-- at the DB layer). Account-level only for v1: tied to profiles.id, not
-- per-workspace — a workspace member's report/signal pushes through the
-- WORKSPACE OWNER's connection, same planCheckUserId resolution already
-- used for the reports plan gate in app/api/interviews/[id]/report/route.ts.
--
-- Single `integrations` table with a provider discriminator rather than
-- separate slack_connections/notion_connections tables: the report-push
-- call site needs both providers in one query, and two tables would need
-- byte-for-byte identical RLS policies — splitting doubles the RLS surface
-- to review for no benefit.
--
-- RLS recursion check (explicit, given the workspace_members incident fixed
-- in supabase-migration-fix-workspace-rls-recursion.sql): both policies
-- below are single-table, single-condition (auth.uid() = user_id), no
-- subqueries, no cross-table reference. Cannot reproduce that bug.

create table if not exists public.integrations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('slack', 'notion')),
  -- Slack: the incoming-webhook URL. Notion: the OAuth access_token. NEVER
  -- include this column in any .select() that returns to a client-facing
  -- API response — routes must only ever return a connected boolean +
  -- display_name, enforced by always naming columns explicitly here.
  access_token text not null,
  display_name text, -- Slack: "{team} · #{channel}"; Notion: workspace name
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists integrations_user_id_idx on public.integrations(user_id);

alter table public.integrations enable row level security;

drop policy if exists "Users can manage their own integrations" on public.integrations;
create policy "Users can manage their own integrations"
  on public.integrations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger integrations_updated_at
  before update on public.integrations
  for each row execute procedure public.handle_updated_at();

-- ─── OAuth CSRF state (single-use, expiring) ──────────────────────────────
-- Server-generated opaque token, stored server-side, checked (not trusted)
-- on callback — same posture as workspace_invites.token, plus expiry and a
-- used_at column so a state can never be redeemed twice.
create table if not exists public.oauth_states (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null check (provider in ('slack', 'notion')),
  state text not null default uuid_generate_v4()::text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create unique index if not exists oauth_states_state_idx on public.oauth_states(state);
create index if not exists oauth_states_user_id_idx on public.oauth_states(user_id);

alter table public.oauth_states enable row level security;

drop policy if exists "Users can manage their own oauth states" on public.oauth_states;
create policy "Users can manage their own oauth states"
  on public.oauth_states for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
