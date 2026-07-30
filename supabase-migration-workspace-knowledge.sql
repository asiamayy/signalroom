-- Shared source materials and a concise workspace brief used as context for
-- research generated inside that workspace.
create table if not exists public.workspace_contexts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  content text not null default '',
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_sources (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  storage_path text not null,
  file_type text not null default '',
  size_bytes bigint not null default 0,
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workspace_sources_workspace_id_idx on public.workspace_sources(workspace_id, created_at desc);

alter table public.workspace_contexts enable row level security;
alter table public.workspace_sources enable row level security;

create policy "Members can manage workspace context"
  on public.workspace_contexts for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Members can manage workspace sources"
  on public.workspace_sources for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

insert into storage.buckets (id, name, public)
values ('workspace-sources', 'workspace-sources', false)
on conflict (id) do nothing;

create policy "Workspace members can manage shared source files"
  on storage.objects for all
  using (
    bucket_id = 'workspace-sources'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid())
  )
  with check (
    bucket_id = 'workspace-sources'
    and public.is_workspace_member((storage.foldername(name))[1]::uuid, auth.uid())
  );
