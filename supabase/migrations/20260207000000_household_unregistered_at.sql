alter table public.households
  add column unregistered_at timestamptz;

comment on column public.households.unregistered_at is
  'Date de désinscription du foyer ; NULL = actif';
