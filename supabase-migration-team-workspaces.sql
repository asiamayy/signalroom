-- Run this in Supabase SQL Editor
--
-- Team workspaces (Broadcast / "agency" plan, 10 seats). NOT a flat shared
-- team pool — an owner creates named workspaces (e.g. one per client) and
-- invites specific people to specific workspaces. A member gets full
-- create/edit access inside workspaces they belong to, and zero visibility
-- into any other workspace or into the owner's personal (non-workspace) data.
--
-- Design: every shareable table (projects/personas/interviews/reports) gets
-- a nullable workspace_id (default null, on delete set null). A null
-- workspace_id means "personal data" and behaves EXACTLY as it does today
-- (owner-only, via auth.uid() = user_id) — this migration changes nothing
-- for any existing row or any Free/Pulse/Signal account. A non-null
-- workspace_id means "visible/editable by any member of that workspace,"
-- checked via workspace_members. The owner is inserted into
-- workspace_members too (role='owner') at creation time, so every RLS
-- policy below is ONE uniform check ("is this uid a member of this
-- workspace_id") rather than a separate owner-bypass branch to audit.

-- ─── Workspaces ───────────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create policy "Members can view their workspaces"
  on public.workspaces for select
  using (
    exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = workspaces.id and wm.user_id = auth.uid()
    )
  );

create policy "Owners can manage their workspaces"
  on public.workspaces for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create index if not exists workspaces_owner_id_idx on public.workspaces(owner_id);

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute procedure public.handle_updated_at();

-- ─── Workspace members ────────────────────────────────────────────────────────
-- The owner is a row here too (role='owner'), inserted at creation time —
-- see the file header comment for why this matters.
create table if not exists public.workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Any co-member can see the member list of a workspace they're in (needed
-- for the "Team members" UI) — but only the owner can add/remove members.
create policy "Members can view co-members of their workspaces"
  on public.workspace_members for select
  using (
    exists (
      select 1 from public.workspace_members my
      where my.workspace_id = workspace_members.workspace_id and my.user_id = auth.uid()
    )
  );

create policy "Owners can manage workspace membership"
  on public.workspace_members for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_members.workspace_id and w.owner_id = auth.uid()
    )
  );

-- A member can always remove themselves ("leave workspace") without owner action.
create policy "Members can remove themselves"
  on public.workspace_members for delete
  using (user_id = auth.uid());

create index if not exists workspace_members_workspace_id_idx on public.workspace_members(workspace_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);

-- ─── Workspace invites (pending, not-yet-accepted) ───────────────────────────
create table if not exists public.workspace_invites (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  invited_email text not null,
  invited_by uuid references public.profiles(id) not null,
  token text not null default uuid_generate_v4()::text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.workspace_invites enable row level security;

create policy "Owners can manage invites for their workspace"
  on public.workspace_invites for all
  using (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_invites.workspace_id and w.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workspaces w
      where w.id = workspace_invites.workspace_id and w.owner_id = auth.uid()
    )
  );

-- Only one live pending invite per (workspace, email) at a time; re-inviting
-- after a revoke is fine (a new row — the old one stays 'revoked').
create unique index if not exists workspace_invites_pending_email_idx
  on public.workspace_invites(workspace_id, invited_email) where status = 'pending';
create unique index if not exists workspace_invites_token_idx
  on public.workspace_invites(token) where status = 'pending';

-- ─── workspace_id added to shareable content tables ──────────────────────────
-- Nullable, on delete set null, everywhere — a row with workspace_id null is
-- untouched personal data, behaving exactly as it does today. Deleting a
-- workspace never deletes content; it just reverts to personal, owned by
-- whichever user_id is already on the row (same behavior as deleting a
-- project today).
alter table public.projects   add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.personas   add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.interviews add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;
alter table public.reports    add column if not exists workspace_id uuid references public.workspaces(id) on delete set null;

create index if not exists projects_workspace_id_idx   on public.projects(workspace_id);
create index if not exists personas_workspace_id_idx   on public.personas(workspace_id);
create index if not exists interviews_workspace_id_idx on public.interviews(workspace_id);
create index if not exists reports_workspace_id_idx    on public.reports(workspace_id);

-- ─── Updated RLS: personal-owner OR workspace-member, never looser than that ─
-- Each of these drops the single existing "auth.uid() = user_id" policy and
-- replaces it with a two-branch policy. The null-workspace branch is
-- character-for-character the same condition as the policy it replaces, so
-- personal (non-workspace) data behaves identically to before this migration.

drop policy if exists "Users can manage their own projects" on public.projects;
create policy "Users can manage projects they own or share via workspace"
  on public.projects for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id and wm.user_id = auth.uid()
    ))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = projects.workspace_id and wm.user_id = auth.uid()
    ))
  );

drop policy if exists "Users can manage their own personas" on public.personas;
create policy "Users can manage personas they own or share via workspace"
  on public.personas for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = personas.workspace_id and wm.user_id = auth.uid()
    ))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = personas.workspace_id and wm.user_id = auth.uid()
    ))
  );

drop policy if exists "Users can manage their own interviews" on public.interviews;
create policy "Users can manage interviews they own or share via workspace"
  on public.interviews for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = interviews.workspace_id and wm.user_id = auth.uid()
    ))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = interviews.workspace_id and wm.user_id = auth.uid()
    ))
  );

drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can manage reports they own or share via workspace"
  on public.reports for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reports.workspace_id and wm.user_id = auth.uid()
    ))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = reports.workspace_id and wm.user_id = auth.uid()
    ))
  );

-- ─── Safe cross-user profile lookup for the "Team members" UI ───────────────
-- profiles' own RLS (auth.uid() = id, select+update only) is NOT loosened —
-- RLS is row-level, not column-level, so a permissive "shared workspace" select
-- policy on profiles would hand every co-member stripe_customer_id/plan/usage
-- counters/briefing, not just name+avatar. This function is security definer,
-- but scoped to exactly 4 safe columns and internally gated on the CALLER
-- being a live member of the workspace being queried — so it carries the same
-- cross-workspace isolation guarantee as everything else, without ever
-- widening profiles' table-level RLS.
create or replace function public.get_workspace_member_profiles(p_workspace_id uuid)
returns table (id uuid, full_name text, avatar_url text, email text, role text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, p.email, wm.role
  from public.workspace_members wm
  join public.profiles p on p.id = wm.user_id
  where wm.workspace_id = p_workspace_id
    and exists (
      select 1 from public.workspace_members caller
      where caller.workspace_id = p_workspace_id and caller.user_id = auth.uid()
    );
$$;
