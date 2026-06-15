alter table public.services
  add column cancelled_at timestamptz null;

create index services_active_idx
  on public.services (service_date)
  where cancelled_at is null;

comment on column public.services.cancelled_at is
  'Date de désactivation du culte (invisible pour les membres, conservé en historique admin).';
