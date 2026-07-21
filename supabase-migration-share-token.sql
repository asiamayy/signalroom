-- Run this in Supabase SQL Editor
-- Reports are no longer public by UUID. A report is only reachable at /r/{token}
-- after the owner explicitly creates a share token; clearing the token revokes
-- every previously shared link.
alter table public.reports add column if not exists share_token text;
create unique index if not exists reports_share_token_key
  on public.reports (share_token)
  where share_token is not null;
