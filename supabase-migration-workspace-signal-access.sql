-- Signals belong to projects. Let anyone with access to a shared workspace
-- project view and create the signals attached to that project's research.
drop policy if exists "Users can manage their own signals" on public.signals;

create policy "Users can manage signals for accessible projects"
  on public.signals for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = signals.project_id
      and (
        (p.workspace_id is null and p.user_id = auth.uid())
        or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id, auth.uid()))
      )
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = signals.project_id
      and (
        (p.workspace_id is null and p.user_id = auth.uid())
        or (p.workspace_id is not null and public.is_workspace_member(p.workspace_id, auth.uid()))
      )
    )
  );
