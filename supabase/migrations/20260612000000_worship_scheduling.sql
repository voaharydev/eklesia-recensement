create table public.services (
  id uuid primary key default gen_random_uuid(),
  service_date date not null unique,
  title text not null default 'Culte dominical',
  created_at timestamptz not null default now()
);

create table public.service_assignments (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  person_id uuid not null references public.persons(id) on delete cascade,
  role_code text not null check (role_code in (
    'powerpoint', 'priere', 'lecture_1', 'lecture_2', 'lecture_3'
  )),
  status text not null default 'draft' check (status in (
    'draft', 'pending', 'accepted', 'declined'
  )),
  decline_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, role_code)
);

create index service_assignments_person_status_idx
  on public.service_assignments (person_id, status);

create index service_assignments_service_id_idx
  on public.service_assignments (service_id);

create or replace function public.set_service_assignment_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger service_assignments_set_updated_at
before update on public.service_assignments
for each row
execute function public.set_service_assignment_updated_at();

alter table public.services enable row level security;
alter table public.service_assignments enable row level security;

comment on table public.services is
  'Cultes dominicaux planifiés (un enregistrement par date).';
comment on table public.service_assignments is
  'Affectations de volontaires aux rôles d''un culte.';
