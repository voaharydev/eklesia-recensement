-- Détection des seaux de doublons potentiels (avant regroupement transitif côté app).
create or replace function public.find_person_duplicate_buckets()
returns table (
  match_type text,
  match_key text,
  person_ids uuid[]
)
language sql
stable
security invoker
as $$
  with email_buckets as (
    select
      'email'::text as match_type,
      lower(trim(email)) as match_key,
      array_agg(id order by id) as person_ids
    from public.persons
    where email is not null
      and trim(email) <> ''
    group by lower(trim(email))
    having count(*) > 1
  ),
  name_buckets as (
    select
      'name'::text as match_type,
      lower(trim(first_name)) || '|' || lower(trim(last_name)) as match_key,
      array_agg(id order by id) as person_ids
    from public.persons
    group by lower(trim(first_name)), lower(trim(last_name))
    having count(*) > 1
  ),
  phone_buckets as (
    select
      'phone'::text as match_type,
      trim(phone) as match_key,
      array_agg(id order by id) as person_ids
    from public.persons
    where phone is not null
      and trim(phone) <> ''
    group by trim(phone)
    having count(*) > 1
  )
  select * from email_buckets
  union all
  select * from name_buckets
  union all
  select * from phone_buckets;
$$;

comment on function public.find_person_duplicate_buckets() is
  'Retourne les groupes bruts de personnes partageant email, nom+prénom ou téléphone.';

-- Fusion transactionnelle de deux profils persons.
create or replace function public.merge_persons(
  p_master uuid,
  p_duplicate uuid
)
returns void
language plpgsql
security invoker
as $$
declare
  v_master_exists boolean;
  v_duplicate_exists boolean;
  v_master_branches jsonb;
  v_duplicate_branches jsonb;
  v_merged_branches jsonb;
  v_master_mpamaky boolean;
  v_duplicate_mpamaky boolean;
begin
  if p_master = p_duplicate then
    raise exception 'Cannot merge person with itself';
  end if;

  select exists(select 1 from public.persons where id = p_master)
    into v_master_exists;
  select exists(select 1 from public.persons where id = p_duplicate)
    into v_duplicate_exists;

  if not v_master_exists then
    raise exception 'Master person % not found', p_master;
  end if;

  if not v_duplicate_exists then
    raise exception 'Duplicate person % not found', p_duplicate;
  end if;

  -- Étape A : réaffecter les cultes (supprimer les conflits puis mettre à jour).
  delete from public.service_assignments dup
  where dup.person_id = p_duplicate
    and exists (
      select 1
      from public.service_assignments m
      where m.person_id = p_master
        and m.service_id = dup.service_id
        and m.role_code = dup.role_code
    );

  update public.service_assignments
  set person_id = p_master
  where person_id = p_duplicate;

  -- Étape B : fusionner les branches JSONB (maître prioritaire par branch_code).
  select branches, is_mpamaky_teny
    into v_master_branches, v_master_mpamaky
  from public.persons
  where id = p_master;

  select branches, is_mpamaky_teny
    into v_duplicate_branches, v_duplicate_mpamaky
  from public.persons
  where id = p_duplicate;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'branch_code', branch_code,
        'role', role
      )
      order by branch_code
    ),
    '[]'::jsonb
  )
  into v_merged_branches
  from (
    select distinct on (branch_code)
      branch_code,
      role
    from (
      select
        elem->>'branch_code' as branch_code,
        elem->>'role' as role,
        priority
      from (
        select elem, 1 as priority
        from jsonb_array_elements(coalesce(v_master_branches, '[]'::jsonb)) as elem
        union all
        select elem, 2 as priority
        from jsonb_array_elements(coalesce(v_duplicate_branches, '[]'::jsonb)) as elem
      ) raw
      where elem->>'branch_code' is not null
        and trim(elem->>'branch_code') <> ''
    ) labeled
    order by branch_code, priority
  ) merged;

  update public.persons
  set
    branches = v_merged_branches,
    is_mpamaky_teny = coalesce(v_master_mpamaky, false) or coalesce(v_duplicate_mpamaky, false)
  where id = p_master;

  -- Étape C : supprimer le doublon.
  delete from public.persons
  where id = p_duplicate;
end;
$$;

comment on function public.merge_persons(uuid, uuid) is
  'Fusionne p_duplicate dans p_master : cultes, branches, puis suppression du doublon.';
