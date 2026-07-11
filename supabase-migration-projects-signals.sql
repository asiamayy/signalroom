-- ─── Persona & Interview → Project linkage ───────────────────────────────────
-- Nullable: existing personas/interviews predate the concept of a project and
-- can't be force-migrated. Unassigned items are treated as an "Unassigned"
-- bucket in the UI; each project's Personas/Interviews tabs let you link
-- existing records after the fact.
alter table public.personas
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists personas_project_id_idx on public.personas(project_id);

alter table public.interviews
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index if not exists interviews_project_id_idx on public.interviews(project_id);

-- ─── Projects: archive support (mirrors personas' archived/archived_at) ──────
alter table public.projects
  add column if not exists archived boolean not null default false;

alter table public.projects
  add column if not exists archived_at timestamptz;

-- ─── Signals: AI-synthesized customer intelligence ───────────────────────────
create table if not exists public.signals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  type text not null check (type in (
    'pain_point',
    'objection',
    'desired_outcome',
    'feature_request',
    'buying_trigger',
    'trend',
    'opportunity',
    'risk'
  )),
  summary text not null,
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  supporting_quotes jsonb not null default '[]',
  related_persona_ids uuid[] not null default '{}',
  related_interview_ids uuid[] not null default '{}',
  status text not null default 'emerging' check (status in ('emerging', 'growing', 'validated')),
  strategic_recommendation text not null default '',
  impact text check (impact in ('low', 'medium', 'high')),
  -- one entry per time this signal is created or reinforced by a new
  -- interview — {date, mentionCount, confidenceScore}[] — powers trend
  -- detection ("mentions up 42% over 30 days") without a separate table
  history jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.signals enable row level security;

create policy "Users can manage their own signals"
  on public.signals for all
  using (auth.uid() = user_id);

create index if not exists signals_user_id_idx on public.signals(user_id);
create index if not exists signals_project_id_idx on public.signals(project_id);
create index if not exists signals_type_idx on public.signals(type);

create trigger signals_updated_at
  before update on public.signals
  for each row execute procedure public.handle_updated_at();

-- ─── Project files ────────────────────────────────────────────────────────────
create table if not exists public.project_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  file_type text not null default '',
  size_bytes bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.project_files enable row level security;

create policy "Users can manage their own project files"
  on public.project_files for all
  using (auth.uid() = user_id);

create index if not exists project_files_project_id_idx on public.project_files(project_id);

-- ─── Storage bucket for project files ─────────────────────────────────────────
-- Private bucket, path-scoped as {user_id}/{project_id}/{filename} so RLS can
-- check the first path segment against auth.uid() without a DB round-trip.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "Users can manage files in their own folder"
  on storage.objects for all
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Cached AI executive briefing (Home dashboard) ───────────────────────────
-- Regenerating this on every dashboard visit would mean a Claude call per
-- page load. Instead it's cached here and only regenerated when stale
-- (see lib/anthropic/briefing-engine.ts).
alter table public.profiles
  add column if not exists briefing jsonb;

alter table public.profiles
  add column if not exists briefing_generated_at timestamptz;
