alter table public.persons
  add column is_mpamaky_teny boolean not null default false;

comment on column public.persons.is_mpamaky_teny is
  'Souhaite servir comme mpamaky teny (lecteur de la Bible)';
