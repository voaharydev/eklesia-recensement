alter table public.persons
  add column created_at timestamptz not null default now(),
  add column updated_at timestamptz not null default now();

update public.persons p
set
  created_at = h.created_at,
  updated_at = h.updated_at
from public.households h
where p.household_id = h.id;

create index persons_updated_at_idx
  on public.persons (updated_at desc);

create or replace function public.set_person_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger persons_set_updated_at
before update on public.persons
for each row
execute function public.set_person_updated_at();

comment on column public.persons.created_at is
  'Date de création du membre dans le recensement.';
comment on column public.persons.updated_at is
  'Dernière modification des données de ce membre.';
