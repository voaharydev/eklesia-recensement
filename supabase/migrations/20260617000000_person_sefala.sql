alter table public.persons
  add column is_sefala boolean not null default false,
  add column sefala_since date;

alter table public.persons
  add constraint persons_sefala_since_check
  check (is_sefala = false or sefala_since is not null);
