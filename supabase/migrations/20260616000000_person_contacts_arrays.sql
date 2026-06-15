alter table public.persons
  add column emails jsonb not null default '[]'::jsonb,
  add column phones jsonb not null default '[]'::jsonb;

update public.persons
set emails = jsonb_build_array(trim(email))
where email is not null
  and trim(email) <> '';

update public.persons
set phones = jsonb_build_array(trim(phone))
where phone is not null
  and trim(phone) <> '';

alter table public.persons
  add constraint persons_emails_is_array_check
  check (jsonb_typeof(emails) = 'array');

alter table public.persons
  add constraint persons_phones_is_array_check
  check (jsonb_typeof(phones) = 'array');

create index persons_emails_gin_idx
  on public.persons using gin (emails jsonb_path_ops);

alter table public.persons
  drop column email,
  drop column phone;

comment on column public.persons.emails is
  'Courriels du membre (1er = principal pour invitations et affichage).';
comment on column public.persons.phones is
  'Téléphones du membre (1er = principal pour affichage).';
