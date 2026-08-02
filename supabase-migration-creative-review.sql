-- Run this in Supabase SQL Editor
--
-- Creative Testing: upload a single visual asset (packaging, ad,
-- landing page) and see how a persona panel reads it, grounded in a real,
-- independently-computed attention map (see lib/vision/saliency.ts) rather
-- than an LLM's guess about a screenshot.
--
-- Own table, following the existing one-table-per-feature convention (see
-- supabase-migration-persisted-runs.sql) rather than folding into
-- concept_test_runs — this reasons about ONE asset with no comparison/winner,
-- a genuinely different shape (zones + per-persona engagement reads) than
-- concept_test_runs' ranked-concepts result.
--
-- Unlike concept_test_runs (which deliberately never persists images), the
-- uploaded asset here IS persisted — it's a single artifact worth keeping
-- for a shareable report, not a disposable comparison input.

create table if not exists public.creative_review_runs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  intended_focus text not null default '',
  persona_ids uuid[] not null default '{}',
  image_storage_path text not null,
  heatmap_storage_path text,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists creative_review_runs_project_id_idx on public.creative_review_runs(project_id);
create index if not exists creative_review_runs_user_id_idx on public.creative_review_runs(user_id);

alter table public.creative_review_runs enable row level security;

drop policy if exists "Users can manage creative review runs they own or share via workspace" on public.creative_review_runs;
create policy "Users can manage creative review runs they own or share via workspace"
  on public.creative_review_runs for all
  using (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  )
  with check (
    (workspace_id is null and auth.uid() = user_id)
    or (workspace_id is not null and public.is_workspace_member(workspace_id, auth.uid()))
  );

-- Storage: private bucket, owner-scoped by folder (same pattern as
-- project-files) — kept simple for v1. A workspace teammate can see a shared
-- run's text results via the table RLS above, but re-viewing the original
-- image/heatmap thumbnail from storage is owner-only for now.
insert into storage.buckets (id, name, public)
values ('creative-review-assets', 'creative-review-assets', false)
on conflict (id) do nothing;

drop policy if exists "Users can manage their own creative review assets" on storage.objects;
create policy "Users can manage their own creative review assets"
  on storage.objects for all
  using (bucket_id = 'creative-review-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'creative-review-assets' and (storage.foldername(name))[1] = auth.uid()::text);
