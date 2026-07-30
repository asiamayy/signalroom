-- Workspace collaboration: durable activity feed. Presence is handled through
-- Supabase Realtime presence channels and therefore needs no persisted rows.
create table if not exists public.workspace_activity (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('workspace_created', 'workspace_renamed', 'member_invited', 'persona_created', 'interview_started', 'report_generated')),
  entity_type text,
  entity_id uuid,
  entity_label text,
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_workspace_created_idx
  on public.workspace_activity(workspace_id, created_at desc);
create unique index if not exists workspace_activity_source_event_idx
  on public.workspace_activity(workspace_id, action, entity_id)
  where entity_id is not null;

-- Seed the feed with existing shared research once, so an established
-- workspace has useful context immediately after this migration is applied.
insert into public.workspace_activity (workspace_id, actor_id, action, entity_type, entity_id, entity_label, created_at)
select workspace_id, user_id, 'persona_created', 'persona', id, name, created_at
from public.personas where workspace_id is not null
union all
select workspace_id, user_id, 'interview_started', 'interview', id, title, created_at
from public.interviews where workspace_id is not null
union all
select r.workspace_id, r.user_id, 'report_generated', 'report', r.id, i.title, r.created_at
from public.reports r left join public.interviews i on i.id = r.interview_id
where r.workspace_id is not null
on conflict do nothing;

alter table public.workspace_activity enable row level security;

create policy "Members can view workspace activity"
  on public.workspace_activity for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

create policy "Members can add their workspace activity"
  on public.workspace_activity for insert
  with check (
    actor_id = auth.uid()
    and public.is_workspace_member(workspace_id, auth.uid())
  );

-- Makes new feed entries available to clients already viewing the workspace.
do $$
begin
  alter publication supabase_realtime add table public.workspace_activity;
exception
  when duplicate_object then null;
end $$;
