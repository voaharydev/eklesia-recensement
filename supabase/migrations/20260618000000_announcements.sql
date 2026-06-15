create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  branch_code text not null,
  verse text,
  subject text not null,
  event_date date,
  event_time time,
  location text,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint announcements_branch_code_check check (
    branch_code in (
      'aff',
      'dorkasy',
      'fdl',
      'fimpiz',
      'miako_fiderana',
      'safif',
      'sampati',
      'sekoly_alahady',
      'slk',
      'stk',
      'vaomiera_fananana',
      'vaomiera_hazakazaka_masina',
      'vaomiera_technika',
      'vaomiera_vola'
    )
  )
);

create index announcements_status_created_at_idx
  on public.announcements (status, created_at desc);

alter table public.announcements enable row level security;

comment on table public.announcements is
  'Filazan-draharaha soumis par les branches (Sampana), en attente de validation admin.';
