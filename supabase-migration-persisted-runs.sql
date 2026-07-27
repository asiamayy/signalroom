-- Run this in Supabase SQL Editor
--
-- Compare, Audience Panel, and Concept Test currently save nothing —
-- results only live in client state and vanish on refresh. This adds real
-- persistence for all three, plus the ability for signals (AI-synthesized
-- customer intelligence, previously only ever produced by the 1:1
-- interview -> report flow) to be extracted from them too.
--
-- Three separate tables, not one polymorphic table — each of these is only
-- ever shown on its own page, has a genuinely different result shape, and
-- nothing needs to query all three in one call site (unlike the
-- `integrations` table, which was unified for exactly that reason). This
-- matches the existing convention of one purpose-built table per concept
-- (reports, project_files, workspaces are all separate too).
--
-- Unlike `signals`/`project_files` (deliberately personal-only), these
-- three DO get workspace_id — they're shareable research artifacts
-- analogous to `reports`, and a Broadcast teammate's Compare run should be
-- visible to the rest of their workspace. Same two-branch RLS as
-- projects/personas/interviews/reports, routed through the existing
-- is_workspace_member() SECURITY DEFINER function (already fixed for
-- recursion in supabase-migration-fix-workspace-rls-recursion.sql) — no
-- self-referential subquery anywhere below, confirmed deliberately.

create table if not exists public.compare_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  question text not null,
  context text not null default '',
  interview_type text not null default 'concept_testing',
  persona_ids uuid[] not null default '{}',
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audience_panel_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  question text not null,
  persona_ids uuid[] not null default '{}',
  result jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.concept_test_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  context text not null default '',
  interview_type text not null default 'concept_testing',
  persona_ids uuid[] not null default '{}',
  concepts jsonb not null default '[]', -- labels/descriptions only, never the base64 images
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists compare_runs_project_id_idx on public.compare_runs(project_id);
create index if not exists compare_runs_user_id_idx on public.compare_runs(user_id);
create index if not exists audience_panel_runs_project_id_idx on public.audience_panel_runs(project_id);
create index if not exists audience_panel_runs_user_id_idx on public.audience_panel_runs(user_id);
create index if not exists concept_test_runs_project_id_idx on public.concept_test_runs(project_id);
create index if not exists concept_test_runs_user_id_idx on public.concept_test_runs(user_id);

alter table public.compare_runs enable row level security;
alter table public.audience_panel_runs enable row level security;
alter table public.concept_test_runs enable row level security;

drop policy if exists "Users can manage compare runs they own or share via workspace" on public.compare_runs;
create policy "Users can manage compare runs they own or share via workspace"
  on public.compare_runs for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

drop policy if exists "Users can manage audience panel runs they own or share via workspace" on public.audience_panel_runs;
create policy "Users can manage audience panel runs they own or share via workspace"
  on public.audience_panel_runs for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

drop policy if exists "Users can manage concept test runs they own or share via workspace" on public.concept_test_runs;
create policy "Users can manage concept test runs they own or share via workspace"
  on public.concept_test_runs for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

-- ─── Signals: track which feature produced a signal ──────────────────────
-- Additive and backward-compatible — every existing row defaults to
-- 'interview' (the only source that existed before this migration) and an
-- empty related_run_ids, so nothing about today's interview -> signal flow
-- changes. related_interview_ids stays interview-only, as it already was;
-- related_run_ids is the generic sibling for the 3 new sources.
alter table public.signals add column if not exists source_type text not null default 'interview'
  check (source_type in ('interview', 'compare', 'audience_panel', 'concept_test'));
alter table public.signals add column if not exists related_run_ids uuid[] not null default '{}';
