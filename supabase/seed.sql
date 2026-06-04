-- Données de test pour le recensement (idempotent)
-- Courriels de test pour la recherche :
--   faniry.rakoto@eklesia.test  → Famille Rakoto (chef + 1 enfant)
--   jean.rasoa@eklesia.test     → Famille Rasoa (chef + conjoint + 1 autre adulte + 1 enfant)
--   marie.andria@eklesia.test   → Famille Andria (chef seul)

delete from public.persons
where household_id in (
  'a0000001-0001-4001-8001-000000000001',
  'a0000001-0001-4001-8001-000000000002',
  'a0000001-0001-4001-8001-000000000003'
);

delete from public.households
where id in (
  'a0000001-0001-4001-8001-000000000001',
  'a0000001-0001-4001-8001-000000000002',
  'a0000001-0001-4001-8001-000000000003'
);

insert into public.households (id, name, main_address, landline_phone, arrival_date_fjkm) values
  (
    'a0000001-0001-4001-8001-000000000001',
    'Famille Rakoto',
    '12 rue de l''Église, Antananarivo 101',
    '022 22 123 45',
    'Mai 2018'
  ),
  (
    'a0000001-0001-4001-8001-000000000002',
    'Famille Rasoa',
    '45 avenue de la Mission, Toamasina 501',
    null,
    'Septembre 2015'
  ),
  (
    'a0000001-0001-4001-8001-000000000003',
    'Famille Andria',
    '8 lotissement Ankadifotsy, Antananarivo 102',
    '022 44 555 00',
    null
  );

insert into public.persons (
  id,
  household_id,
  first_name,
  last_name,
  email,
  phone,
  preferred_language,
  is_visible_in_directory,
  is_baptized,
  baptized_since,
  is_mpiandry,
  mpiandry_since,
  is_mpandray,
  mpandray_since,
  is_child,
  age,
  branches,
  church_assignments,
  civility,
  role
) values
  (
    'b0000001-0001-4001-8001-000000000001',
    'a0000001-0001-4001-8001-000000000001',
    'Faniry',
    'Rakoto',
    'faniry.rakoto@eklesia.test',
    '+261 32 11 222 33',
    'fr',
    true,
    true,
    '2010-04-12',
    true,
    '2018-09-01',
    false,
    null,
    false,
    38,
    '[{"branch_code": "sekoly_alahady", "role": "Chorale"}]'::jsonb,
    'Chorale, comité d''accueil',
    'Mme',
    'chef_de_famille'
  ),
  (
    'b0000001-0001-4001-8001-000000000002',
    'a0000001-0001-4001-8001-000000000001',
    'Hery',
    'Rakoto',
    null,
    '+261 32 11 222 34',
    'mg',
    true,
    true,
    '2015-06-20',
    false,
    null,
    false,
    null,
    true,
    9,
    '[]'::jsonb,
    'Catéchisme enfants',
    null,
    'enfant'
  ),
  (
    'b0000001-0001-4001-8001-000000000003',
    'a0000001-0001-4001-8001-000000000002',
    'Jean',
    'Rasoa',
    'jean.rasoa@eklesia.test',
    '+261 34 22 333 44',
    'fr',
    true,
    true,
    '1998-03-15',
    false,
    null,
    true,
    '2020-01-10',
    false,
    48,
    '[{"branch_code": "aff", "role": "Président de filiale"}]'::jsonb,
    'Président de filiale, enseignement',
    'M.',
    'chef_de_famille'
  ),
  (
    'b0000001-0001-4001-8001-000000000004',
    'a0000001-0001-4001-8001-000000000002',
    'Claire',
    'Rasoa',
    'claire.rasoa@eklesia.test',
    null,
    'fr',
    false,
    true,
    '2001-11-08',
    true,
    '2016-05-22',
    false,
    null,
    false,
    44,
    '[{"branch_code": "sampati", "role": null}]'::jsonb,
    'Diaconie, visites aux malades',
    'Mme',
    'conjoint'
  ),
  (
    'b0000001-0001-4001-8001-000000000007',
    'a0000001-0001-4001-8001-000000000002',
    'Luc',
    'Rasoa',
    null,
    '+261 34 22 333 99',
    'mg',
    true,
    true,
    '1975-02-10',
    false,
    null,
    false,
    null,
    false,
    72,
    '[]'::jsonb,
    'Parent vivant au foyer',
    'M.',
    'autre'
  ),
  (
    'b0000001-0001-4001-8001-000000000005',
    'a0000001-0001-4001-8001-000000000002',
    'Paul',
    'Rasoa',
    null,
    null,
    'fr',
    true,
    false,
    null,
    false,
    null,
    false,
    null,
    true,
    6,
    '[]'::jsonb,
    null,
    null,
    'enfant'
  ),
  (
    'b0000001-0001-4001-8001-000000000006',
    'a0000001-0001-4001-8001-000000000003',
    'Marie',
    'Andria',
    'marie.andria@eklesia.test',
    '+261 33 44 555 66',
    'fr',
    true,
    true,
    '2005-07-30',
    true,
    '2014-02-14',
    true,
    '2019-08-25',
    false,
    39,
    '[{"branch_code": "vaomiera_fananana", "role": "Louange"}]'::jsonb,
    'Secrétariat paroissial, louange',
    'Mme',
    'chef_de_famille'
  );
