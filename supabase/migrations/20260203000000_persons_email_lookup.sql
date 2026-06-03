create index persons_email_lower_idx
  on public.persons (lower(trim(email)))
  where email is not null;
