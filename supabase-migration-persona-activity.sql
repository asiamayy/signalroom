-- Persona activity: a durable, per-persona history of meaningful research actions.
create table if not exists public.persona_activity (
  id uuid primary key default uuid_generate_v4(),
  persona_id uuid not null references public.personas(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('persona_created', 'stage_changed', 'journey_created', 'interview_started', 'report_generated', 'persona_archived', 'persona_restored', 'project_changed')),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists persona_activity_persona_created_idx
  on public.persona_activity(persona_id, created_at desc);

alter table public.persona_activity enable row level security;

create policy "Users can view activity for accessible personas"
  on public.persona_activity for select
  using (
    exists (
      select 1 from public.personas p
      where p.id = persona_activity.persona_id
      and (
        p.user_id = auth.uid()
        or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id, auth.uid()))
      )
    )
  );

create policy "Users can add activity for accessible personas"
  on public.persona_activity for insert
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.personas p
      where p.id = persona_activity.persona_id
      and (
        p.user_id = auth.uid()
        or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id, auth.uid()))
      )
    )
  );

-- Give existing personas a useful history immediately after the migration.
insert into public.persona_activity (persona_id, actor_id, action, detail, created_at)
select p.id, p.user_id, 'persona_created', p.name, p.created_at
from public.personas p
where not exists (
  select 1 from public.persona_activity a
  where a.persona_id = p.id and a.action = 'persona_created'
);

insert into public.persona_activity (persona_id, actor_id, action, detail, created_at)
select i.persona_id, i.user_id, 'interview_started', i.title, i.created_at
from public.interviews i
where i.persona_id is not null
and not exists (
  select 1 from public.persona_activity a
  where a.persona_id = i.persona_id and a.action = 'interview_started' and a.detail = i.title and a.created_at = i.created_at
);

insert into public.persona_activity (persona_id, actor_id, action, detail, created_at)
select i.persona_id, r.user_id, 'report_generated', i.title, r.created_at
from public.reports r
join public.interviews i on i.id = r.interview_id
where i.persona_id is not null
and not exists (
  select 1 from public.persona_activity a
  where a.persona_id = i.persona_id and a.action = 'report_generated' and a.detail = i.title and a.created_at = r.created_at
);

insert into public.persona_activity (persona_id, actor_id, action, detail, created_at)
select j.persona_id, j.user_id, 'journey_created', j.title, j.created_at
from public.journeys j
where not exists (
  select 1 from public.persona_activity a
  where a.persona_id = j.persona_id and a.action = 'journey_created' and a.detail = j.title and a.created_at = j.created_at
);
