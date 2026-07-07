-- ─── Persona funnel stage (for dashboard filter tabs) ────────────────────────
alter table public.personas
  add column if not exists funnel_stage text not null default 'awareness'
  check (funnel_stage in ('awareness', 'consideration', 'purchase', 'loyalty'));

-- ─── Projects (sidebar "Recent Projects") ────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can manage their own projects"
  on public.projects for all
  using (auth.uid() = user_id);

create index if not exists projects_user_id_idx on public.projects(user_id);

create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- ─── Journeys (AI-generated persona user-journey maps) ───────────────────────
create table if not exists public.journeys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  persona_id uuid references public.personas(id) on delete cascade not null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.journeys enable row level security;

create policy "Users can manage their own journeys"
  on public.journeys for all
  using (auth.uid() = user_id);

create index if not exists journeys_persona_id_idx on public.journeys(persona_id);

-- ─── Journey steps (ordered timeline entries within a journey) ───────────────
create table if not exists public.journey_steps (
  id uuid primary key default uuid_generate_v4(),
  journey_id uuid references public.journeys(id) on delete cascade not null,
  step_order integer not null,
  phase_name text not null,
  user_action text not null,
  internal_thoughts text not null,
  emotional_score integer not null check (emotional_score between -5 and 5),
  friction_point text,
  created_at timestamptz not null default now()
);

alter table public.journey_steps enable row level security;

create policy "Users can manage steps of their own journeys"
  on public.journey_steps for all
  using (
    exists (
      select 1 from public.journeys
      where journeys.id = journey_steps.journey_id
      and journeys.user_id = auth.uid()
    )
  );

create index if not exists journey_steps_journey_id_idx on public.journey_steps(journey_id);
