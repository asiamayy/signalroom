-- Saved, unfinished Persona Builder work. Drafts are private to the creator,
-- do not count toward plan usage, and are kept separate from completed personas.
create table if not exists public.persona_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists persona_drafts_user_id_updated_at_idx
  on public.persona_drafts(user_id, updated_at desc);

alter table public.persona_drafts enable row level security;

drop policy if exists "Users can manage their own persona drafts" on public.persona_drafts;
create policy "Users can manage their own persona drafts"
  on public.persona_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists persona_drafts_updated_at on public.persona_drafts;
create trigger persona_drafts_updated_at
  before update on public.persona_drafts
  for each row execute function public.handle_updated_at();
