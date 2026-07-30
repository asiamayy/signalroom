-- Shared report discussions for workspace members. Comments intentionally
-- belong to a report and can be anchored to a report section or another
-- comment, keeping the model ready for inline threads as the UI expands.
create table if not exists public.workspace_comments (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  parent_id uuid references public.workspace_comments(id) on delete cascade,
  section_key text not null default 'report',
  content text not null check (char_length(trim(content)) between 1 and 3000),
  author_id uuid references public.profiles(id) on delete set null,
  mentioned_user_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_comments_report_created_idx
  on public.workspace_comments(report_id, created_at asc);
create index if not exists workspace_comments_workspace_created_idx
  on public.workspace_comments(workspace_id, created_at desc);

alter table public.workspace_comments enable row level security;

create policy "Workspace members can view report discussions"
  on public.workspace_comments for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Workspace members can add report discussions"
  on public.workspace_comments for insert
  with check (
    author_id = auth.uid()
    and public.is_workspace_member(workspace_id, auth.uid())
  );

create policy "Authors can update their report discussions"
  on public.workspace_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Authors can delete their report discussions"
  on public.workspace_comments for delete
  using (author_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.workspace_comments;
exception
  when duplicate_object then null;
end $$;
