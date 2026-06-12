alter table public.households
  add column updated_at timestamptz not null default now();

update public.households
set updated_at = created_at;

create index households_updated_at_idx
  on public.households (updated_at desc);

create or replace function public.set_household_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger households_set_updated_at
before update on public.households
for each row
execute function public.set_household_updated_at();

create or replace function public.touch_household_from_person()
returns trigger
language plpgsql
as $$
declare
  target_household_id uuid;
begin
  target_household_id := coalesce(new.household_id, old.household_id);

  update public.households
  set updated_at = now()
  where id = target_household_id;

  return coalesce(new, old);
end;
$$;

create trigger persons_touch_household_updated_at
after insert or update or delete on public.persons
for each row
execute function public.touch_household_from_person();

comment on column public.households.updated_at is
  'Dernière modification du foyer ou de l’un de ses membres.';
