-- Met à jour les anciens codes de branche (démo) vers la liste officielle.
update public.persons
set branches = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'branch_code',
        case elem->>'branch_code'
          when 'ankadifotsy' then 'sekoly_alahady'
          when 'toamasina_centre' then 'sampati'
          else elem->>'branch_code'
        end,
        'role',
        elem->'role'
      )
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(persons.branches) as elem
)
where branches is not null
  and branches <> '[]'::jsonb
  and branches::text like any (array['%ankadifotsy%', '%toamasina_centre%']);
