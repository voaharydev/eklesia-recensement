-- extensions
create extension if not exists "pgcrypto";

-- households
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  main_address text not null,
  created_at timestamptz not null default now()
);

-- persons
create table public.persons (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  preferred_language text not null default 'fr',
  is_visible_in_directory boolean not null default true
);

create index persons_household_id_idx on public.persons(household_id);

-- RLS (aucune policy = accès API bloqué sauf service role)
alter table public.households enable row level security;
alter table public.persons enable row level security;
