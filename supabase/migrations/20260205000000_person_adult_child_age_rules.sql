-- Adultes : plus de 15 ans (âge >= 16). Enfants : 0 à 15 ans, rattachés au foyer.
update public.persons
set age = 16
where is_child = false and age is null;

alter table public.persons
  drop constraint if exists persons_age_child_check;

alter table public.persons
  add constraint persons_age_role_check
  check (
    (is_child = false and age is not null and age >= 16)
    or (is_child = true and age is not null and age >= 0 and age <= 15)
  );
