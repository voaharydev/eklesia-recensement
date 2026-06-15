-- Étend merge_persons pour le patch is_sefala.
create or replace function public.merge_persons(
  p_master uuid,
  p_duplicate uuid,
  p_patch jsonb default null
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

  select branches, is_mpamaky_teny
    into v_master_branches, v_master_mpamaky
  from public.persons
  where id = p_master;

  select branches, is_mpamaky_teny
    into v_duplicate_branches, v_duplicate_mpamaky
  from public.persons
  where id = p_duplicate;

  if p_patch is not null and p_patch ? 'branches' then
    v_merged_branches := coalesce(p_patch->'branches', '[]'::jsonb);
  else
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
  end if;

  update public.persons m
  set
    first_name = case
      when p_patch is not null and p_patch ? 'first_name'
        then nullif(trim(p_patch->>'first_name'), '')
      else m.first_name
    end,
    last_name = case
      when p_patch is not null and p_patch ? 'last_name'
        then nullif(trim(p_patch->>'last_name'), '')
      else m.last_name
    end,
    emails = case
      when p_patch is not null and p_patch ? 'emails'
        then coalesce(p_patch->'emails', '[]'::jsonb)
      else m.emails
    end,
    phones = case
      when p_patch is not null and p_patch ? 'phones'
        then coalesce(p_patch->'phones', '[]'::jsonb)
      else m.phones
    end,
    role = case
      when p_patch is not null and p_patch ? 'role'
        then p_patch->>'role'
      else m.role
    end,
    age = case
      when p_patch is not null and p_patch ? 'age' then
        case
          when p_patch->>'age' is null or trim(p_patch->>'age') = '' then null
          else (p_patch->>'age')::integer
        end
      else m.age
    end,
    branches = v_merged_branches,
    is_baptized = case
      when p_patch is not null and p_patch ? 'is_baptized'
        then (p_patch->>'is_baptized')::boolean
      else m.is_baptized
    end,
    is_mpandray = case
      when p_patch is not null and p_patch ? 'is_mpandray'
        then (p_patch->>'is_mpandray')::boolean
      else m.is_mpandray
    end,
    is_mpiandry = case
      when p_patch is not null and p_patch ? 'is_mpiandry'
        then (p_patch->>'is_mpiandry')::boolean
      else m.is_mpiandry
    end,
    is_sefala = case
      when p_patch is not null and p_patch ? 'is_sefala'
        then (p_patch->>'is_sefala')::boolean
      else m.is_sefala
    end,
    is_mpamaky_teny = case
      when p_patch is not null and p_patch ? 'is_mpamaky_teny'
        then (p_patch->>'is_mpamaky_teny')::boolean
      else coalesce(v_master_mpamaky, false) or coalesce(v_duplicate_mpamaky, false)
    end
  where m.id = p_master;

  delete from public.persons
  where id = p_duplicate;
end;
$$;
