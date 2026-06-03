alter table public.persons
  add column branches jsonb not null default '[]'::jsonb;

alter table public.persons
  add constraint persons_branches_is_array_check
  check (jsonb_typeof(branches) = 'array');

update public.persons
set branches = case branch
  when 'Branche Ankadifotsy' then
    jsonb_build_array(jsonb_build_object('branch_code', 'ankadifotsy', 'role', null))
  when 'Branche Toamasina Centre' then
    jsonb_build_array(jsonb_build_object('branch_code', 'toamasina_centre', 'role', null))
  else '[]'::jsonb
end
where branch is not null and branch <> '';

alter table public.persons
  drop column branch;
