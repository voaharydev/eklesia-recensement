alter table public.persons
  add column is_baptized boolean not null default false,
  add column baptized_since date,
  add column is_mpiandry boolean not null default false,
  add column mpiandry_since date,
  add column is_mpandray boolean not null default false,
  add column mpandray_since date,
  add column is_child boolean not null default false,
  add column age smallint,
  add column branch text,
  add column church_assignments text;

alter table public.persons
  add constraint persons_age_child_check
  check (is_child = false or (age is not null and age >= 0 and age <= 25));

alter table public.persons
  add constraint persons_baptized_since_check
  check (is_baptized = false or baptized_since is not null);

alter table public.persons
  add constraint persons_mpiandry_since_check
  check (is_mpiandry = false or mpiandry_since is not null);

alter table public.persons
  add constraint persons_mpandray_since_check
  check (is_mpandray = false or mpandray_since is not null);
