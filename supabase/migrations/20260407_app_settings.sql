-- app_settings: stores global key/value config flags (e.g. mystery_mode)
create table if not exists public.app_settings (
  key   text primary key,
  value text not null default 'false'
);

-- Seed the mystery_mode row so it always exists
insert into public.app_settings (key, value)
values ('mystery_mode', 'false')
on conflict (key) do nothing;

-- RLS: public can READ settings (so the leaderboard page can check mystery_mode)
alter table public.app_settings enable row level security;

create policy "Public can read app_settings"
  on public.app_settings
  for select
  using (true);

-- Only authenticated admins can UPDATE settings (service role bypasses RLS anyway,
-- but this covers direct anon/user calls)
create policy "Admins can update app_settings"
  on public.app_settings
  for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Admins can insert app_settings"
  on public.app_settings
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

-- Enable Realtime so the public leaderboard snaps to mystery_mode changes instantly
alter publication supabase_realtime add table public.app_settings;
