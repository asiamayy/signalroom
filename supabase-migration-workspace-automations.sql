-- Workspace-specific notifications. The webhook URL is never exposed through
-- RLS; owner-authenticated API routes use the service role to manage and
-- dispatch it, while all browser responses omit this sensitive column.
create table if not exists public.workspace_automations (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('slack', 'teams')),
  display_name text not null default 'Workspace updates',
  webhook_url text not null,
  events text[] not null default array['persona_created', 'interview_started', 'report_generated']::text[]
    check (events <@ array['persona_created', 'interview_started', 'report_generated']::text[]),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_automations_workspace_idx
  on public.workspace_automations(workspace_id);

alter table public.workspace_automations enable row level security;

-- No browser table policies by design. Owner authorization is enforced in the
-- API routes, and only those routes use the service role to see webhook URLs.
