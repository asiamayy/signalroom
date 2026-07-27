-- Run this in Supabase SQL Editor — hotfix for the team-workspaces migration
--
-- Bug: every policy checking "is this uid a member of this workspace" did a
-- raw subquery against workspace_members. But workspace_members has its own
-- RLS policy that ALSO queries workspace_members (to check "is the caller a
-- co-member of this row's workspace"). That's a real cycle: evaluating the
-- policy requires re-evaluating the same policy. Postgres detects this and
-- raises "infinite recursion detected in policy for relation
-- workspace_members" (42P17) — which PostgREST surfaces as a 500. Since
-- projects/personas/interviews/reports/workspaces all transitively touch
-- workspace_members in their own policies, this took down every one of them
-- at once. No data was lost — this is a request-time error, not empty rows.
--
-- Fix: route the membership check through a SECURITY DEFINER function.
-- Such a function runs as its owner (postgres, the table owner here), and
-- table owners bypass their own table's RLS by default (no FORCE ROW LEVEL
-- SECURITY is set anywhere in this schema) — so the function's internal
-- query never re-enters any policy, breaking the cycle completely.

create or replace function public.is_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = p_workspace_id and user_id = p_user_id
  );
$$;

-- ─── workspaces ───────────────────────────────────────────────────────────
drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
  on public.workspaces for select
  using ( public.is_workspace_member(workspaces.id, auth.uid()) );

-- ─── workspace_members ────────────────────────────────────────────────────
drop policy if exists "Members can view co-members of their workspaces" on public.workspace_members;
create policy "Members can view co-members of their workspaces"
  on public.workspace_members for select
  using ( public.is_workspace_member(workspace_members.workspace_id, auth.uid()) );

-- ─── projects / personas / interviews / reports ──────────────────────────
drop policy if exists "Users can manage projects they own or share via workspace" on public.projects;
create policy "Users can manage projects they own or share via workspace"
  on public.projects for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

drop policy if exists "Users can manage personas they own or share via workspace" on public.personas;
create policy "Users can manage personas they own or share via workspace"
  on public.personas for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

drop policy if exists "Users can manage interviews they own or share via workspace" on public.interviews;
create policy "Users can manage interviews they own or share via workspace"
  on public.interviews for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

drop policy if exists "Users can manage reports they own or share via workspace" on public.reports;
create policy "Users can manage reports they own or share via workspace"
  on public.reports for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );
