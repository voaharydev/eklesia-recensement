create table public.announcement_attachments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null check (file_size > 0),
  created_at timestamptz not null default now()
);

create index announcement_attachments_announcement_id_idx
  on public.announcement_attachments (announcement_id);

alter table public.announcement_attachments enable row level security;

comment on table public.announcement_attachments is
  'Pièces jointes des annonces Filazan-draharaha (stockées dans Supabase Storage).';

insert into storage.buckets (id, name, public)
values ('announcement-attachments', 'announcement-attachments', false)
on conflict (id) do nothing;
