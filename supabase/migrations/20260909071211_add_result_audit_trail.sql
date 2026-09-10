create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('admin', 'super_admin')
    );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.results
  add column if not exists points integer not null default 0,
  add column if not exists assigned_by uuid references public.profiles(id) on delete set null,
  add column if not exists assigned_by_email text,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by_email text,
  add column if not exists updated_at timestamp with time zone not null default timezone('utc'::text, now());

create index if not exists results_assigned_by_idx on public.results (assigned_by);
create index if not exists results_updated_at_idx on public.results (updated_at desc);

create table if not exists public.result_activity_log (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null,
  tournament_id uuid,
  event_id uuid,
  event_name text,
  department_id uuid,
  department_name text,
  medal_type text,
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_email text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists result_activity_log_tournament_created_idx
  on public.result_activity_log (tournament_id, created_at desc);
create index if not exists result_activity_log_event_created_idx
  on public.result_activity_log (event_id, created_at desc);
create index if not exists result_activity_log_actor_created_idx
  on public.result_activity_log (actor_id, created_at desc);

alter table public.results enable row level security;
alter table public.result_activity_log enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'results'
      and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')
  loop
    execute format('drop policy if exists %I on public.results', policy_record.policyname);
  end loop;
end;
$$;

drop policy if exists "Public can read results" on public.results;
create policy "Public can read results"
  on public.results
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert results"
  on public.results
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "Admins can update results"
  on public.results
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can delete results"
  on public.results
  for delete
  to authenticated
  using ((select private.is_admin()));

revoke insert, update, delete on public.results from anon;
grant select on public.results to anon;
grant select, insert, update, delete on public.results to authenticated;

revoke all on public.result_activity_log from anon, authenticated;
grant select on public.result_activity_log to authenticated;

drop policy if exists "Admins can read result activity" on public.result_activity_log;
create policy "Admins can read result activity"
  on public.result_activity_log
  for select
  to authenticated
  using ((select private.is_admin()));

create or replace function private.set_result_actor()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_email text;
begin
  if actor_id is not null then
    actor_email := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email';

    if actor_email is null then
    select profiles.email
      into actor_email
      from public.profiles
      where profiles.id = actor_id;
    end if;
  else
    actor_email := current_user;
  end if;

  if tg_op = 'INSERT' then
    new.assigned_by := actor_id;
    new.assigned_by_email := actor_email;
  else
    new.assigned_by := old.assigned_by;
    new.assigned_by_email := old.assigned_by_email;
  end if;

  new.updated_by := actor_id;
  new.updated_by_email := actor_email;
  new.updated_at := timezone('utc'::text, now());
  return new;
end;
$$;

revoke all on function private.set_result_actor() from public, anon, authenticated;

drop trigger if exists set_result_actor_before_write on public.results;
create trigger set_result_actor_before_write
  before insert or update on public.results
  for each row
  execute function private.set_result_actor();

create or replace function private.audit_result_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  result_row public.results;
  actor_id uuid := (select auth.uid());
  actor_email text;
  event_name text;
  department_name text;
begin
  if tg_op = 'DELETE' then
    result_row := old;
  else
    result_row := new;
  end if;

  select profiles.email
    into actor_email
    from public.profiles
    where profiles.id = actor_id;

  actor_email := coalesce(actor_email, current_user);

  select events.name
    into event_name
    from public.events
    where events.id = result_row.event_id;

  select coalesce(tournament_departments.name, departments.name)
    into department_name
    from public.departments
    left join public.tournament_departments
      on tournament_departments.department_id = departments.id
     and tournament_departments.tournament_id = result_row.tournament_id
    where departments.id = result_row.department_id
    limit 1;

  insert into public.result_activity_log (
    result_id,
    tournament_id,
    event_id,
    event_name,
    department_id,
    department_name,
    medal_type,
    action,
    actor_id,
    actor_email,
    old_data,
    new_data
  ) values (
    result_row.id,
    result_row.tournament_id,
    result_row.event_id,
    event_name,
    result_row.department_id,
    department_name,
    result_row.medal_type,
    lower(tg_op),
    actor_id,
    actor_email,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return result_row;
end;
$$;

revoke all on function private.audit_result_change() from public, anon, authenticated;

drop trigger if exists audit_result_after_write on public.results;
create trigger audit_result_after_write
  after insert or update or delete on public.results
  for each row
  execute function private.audit_result_change();

create or replace function public.replace_event_results(
  p_event_id uuid,
  p_tournament_id uuid,
  p_results jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access is required.' using errcode = '42501';
  end if;

  if p_results is null or jsonb_typeof(p_results) <> 'array' then
    raise exception 'Results must be a JSON array.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.events
    where events.id = p_event_id
      and events.tournament_id = p_tournament_id
  ) then
    raise exception 'Event does not belong to the selected tournament.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(department_id uuid, medal_type text)
    where result.medal_type not in ('gold', 'silver', 'bronze')
  ) then
    raise exception 'Invalid medal type.' using errcode = '22023';
  end if;

  if exists (
    select result.medal_type
    from jsonb_to_recordset(p_results) as result(department_id uuid, medal_type text)
    group by result.medal_type
    having count(*) > 1
  ) then
    raise exception 'Only one result is allowed for each medal.' using errcode = '22023';
  end if;

  if exists (
    select result.department_id
    from jsonb_to_recordset(p_results) as result(department_id uuid, medal_type text)
    where result.department_id is not null
    group by result.department_id
    having count(*) > 1
  ) then
    raise exception 'A team cannot receive more than one medal in an event.' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_results) as result(department_id uuid, medal_type text)
    where result.department_id is not null
      and not exists (
        select 1
        from public.tournament_departments
        where tournament_departments.tournament_id = p_tournament_id
          and tournament_departments.department_id = result.department_id
      )
  ) then
    raise exception 'A result contains a team outside the selected tournament.' using errcode = '22023';
  end if;

  delete from public.results
  where results.event_id = p_event_id
    and results.tournament_id = p_tournament_id;

  insert into public.results (
    event_id,
    department_id,
    medal_type,
    points,
    tournament_id
  )
  select
    p_event_id,
    result.department_id,
    result.medal_type,
    case result.medal_type
      when 'gold' then 200
      when 'silver' then 150
      when 'bronze' then 100
    end,
    p_tournament_id
  from jsonb_to_recordset(p_results) as result(department_id uuid, medal_type text);
end;
$$;

revoke all on function public.replace_event_results(uuid, uuid, jsonb) from public, anon;
grant execute on function public.replace_event_results(uuid, uuid, jsonb) to authenticated;
