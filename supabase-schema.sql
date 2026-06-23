-- ─── Enable extensions ────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'starter' check (plan in ('starter', 'pro', 'agency')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  interviews_used integer not null default 0,
  personas_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Personas ─────────────────────────────────────────────────────────────────
create table public.personas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  avatar_initials text not null,
  avatar_color jsonb not null default '{}',
  traits jsonb not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.personas enable row level security;

create policy "Users can manage their own personas"
  on public.personas for all
  using (auth.uid() = user_id);

create index personas_user_id_idx on public.personas(user_id);

-- ─── Interviews ───────────────────────────────────────────────────────────────
create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  persona_id uuid references public.personas(id) on delete set null,
  title text not null,
  type text not null check (type in (
    'concept_testing',
    'pricing_discovery',
    'message_testing',
    'competitive_positioning',
    'feature_prioritization',
    'custom'
  )),
  status text not null default 'active' check (status in ('draft', 'active', 'completed')),
  context text not null default '',
  messages jsonb not null default '[]',
  report_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.interviews enable row level security;

create policy "Users can manage their own interviews"
  on public.interviews for all
  using (auth.uid() = user_id);

create index interviews_user_id_idx on public.interviews(user_id);
create index interviews_persona_id_idx on public.interviews(persona_id);

-- ─── Reports ──────────────────────────────────────────────────────────────────
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  interview_id uuid references public.interviews(id) on delete cascade not null,
  executive_summary text not null,
  key_themes jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  confidence_score integer not null default 0 check (confidence_score between 0 and 100),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for all
  using (auth.uid() = user_id);

create index reports_user_id_idx on public.reports(user_id);
create index reports_interview_id_idx on public.reports(interview_id);

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger personas_updated_at
  before update on public.personas
  for each row execute procedure public.handle_updated_at();

create trigger interviews_updated_at
  before update on public.interviews
  for each row execute procedure public.handle_updated_at();
