begin;

alter table public.match_predictions enable row level security;

drop policy if exists "Allow anonymous insert for match_predictions"
  on public.match_predictions;

revoke insert, update, delete, truncate
  on table public.match_predictions
  from anon, authenticated;

grant select
  on table public.match_predictions
  to anon, authenticated;

comment on column public.match_predictions.ip_hash is
  'Opaque HMAC voter fingerprint. Legacy column name retained for compatibility.';

commit;
