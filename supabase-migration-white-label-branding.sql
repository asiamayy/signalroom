-- Run this in Supabase SQL Editor
--
-- White-label branding (Broadcast / "agency" plan). Closes the gap between
-- what shipped earlier (hiding SignalRoom's own logo/CTA on shared reports)
-- and what "white label" actually means in this market — every comparable
-- product (AgencyAnalytics, Whatagraph, DashThis) treats "remove our logo"
-- as table stakes and "add yours" as the real feature: a custom logo and
-- brand color so a shared report reads as the agency's own deliverable, not
-- just an anonymized one.
--
-- Storage: a public bucket, path-scoped {user_id}/... so RLS can check the
-- first path segment against auth.uid() for uploads, same convention as the
-- existing project-files bucket. Public (not signed URLs) because the logo
-- must render on /r/[id], an unauthenticated public page.

alter table public.profiles add column if not exists brand_logo_url text;
alter table public.profiles add column if not exists brand_color text;

insert into storage.buckets (id, name, public)
values ('brand-assets', 'brand-assets', true)
on conflict (id) do nothing;

create policy "Users can manage their own brand assets"
  on storage.objects for all
  using (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'brand-assets' and (storage.foldername(name))[1] = auth.uid()::text);
