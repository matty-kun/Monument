-- Mystery mode belongs to a tournament so archived and active events remain isolated.
drop policy if exists "Admins can update tournament settings" on public.tournaments;

create policy "Admins can update tournament settings"
  on public.tournaments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('admin', 'super_admin')
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournaments'
  ) then
    alter publication supabase_realtime add table public.tournaments;
  end if;
end $$;
