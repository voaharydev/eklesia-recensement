-- Champs historiques Excel + rôles foyer (chef, conjoint, enfant, autre)

alter table public.households
  add column landline_phone text,
  add column arrival_date_fjkm text;

comment on column public.households.landline_phone is
  'Téléphone fixe du foyer';
comment on column public.households.arrival_date_fjkm is
  'Date ou période d''arrivée à la FJKM Québec (texte libre)';

alter table public.persons
  add column civility text,
  add column role text;

-- Backfill avant NOT NULL
update public.persons
set role = 'enfant'
where is_child = true and role is null;

with ranked_adults as (
  select
    id,
    household_id,
    row_number() over (
      partition by household_id
      order by last_name, first_name, id
    ) as adult_rank
  from public.persons
  where is_child = false and role is null
)
update public.persons p
set role = case
  when r.adult_rank = 1 then 'chef_de_famille'
  when r.adult_rank = 2 then 'conjoint'
  else 'autre'
end
from ranked_adults r
where p.id = r.id;

alter table public.persons
  alter column role set not null;

alter table public.persons
  add constraint persons_role_check
  check (role in ('chef_de_famille', 'conjoint', 'enfant', 'autre'));
