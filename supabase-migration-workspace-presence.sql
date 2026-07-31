-- Run this in Supabase SQL Editor.
-- Keeps a workspace-specific last-seen time after a realtime presence session
-- ends. It never records personal browsing outside that workspace.

alter table public.workspace_members
  add column if not exists last_seen_at timestamptz;

create index if not exists workspace_members_last_seen_idx
  on public.workspace_members(workspace_id, last_seen_at desc nulls last);

-- The existing RPC intentionally exposes only safe profile fields. Extend it
-- with the workspace-scoped last-seen timestamp without loosening profiles RLS.
drop function if exists public.get_workspace_member_profiles(uuid);

create function public.get_workspace_member_profiles(p_workspace_id uuid)
returns table (id uuid, full_name text, avatar_url text, email text, role text, last_seen_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.email, wm.role, wm.last_seen_at
  from public.workspace_members wm
  join public.profiles p on p.id = wm.user_id
  where wm.workspace_id = p_workspace_id
    and exists (
      select 1 from public.workspace_members caller
      where caller.workspace_id = p_workspace_id and caller.user_id = auth.uid()
    );
$$;
