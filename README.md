# Recensement — Église

Application Next.js 14 pour l'inscription des foyers et de leurs membres (recensement paroissial).

## Prérequis

- Node.js 18+
- Un projet [Supabase](https://supabase.com)

## Configuration

1. Copier les variables d'environnement :

```bash
cp .env.local.example .env.local
```

2. Renseigner dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL` — URL du projet (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` — clé **service role** (serveur uniquement, jamais `NEXT_PUBLIC_`)

3. Appliquer la migration SQL :

```bash
# Avec Supabase CLI lié au projet
supabase db push

# Ou exécuter manuellement les fichiers dans supabase/migrations/
# dans l'éditeur SQL du dashboard Supabase :
# - 20260102000000_init_households_persons.sql
# - 20260203000000_persons_email_lookup.sql
```

## Données de test

Après avoir appliqué les migrations :

```bash
npm run db:seed
```

Ou exécuter [`supabase/seed.sql`](supabase/seed.sql) dans l’éditeur SQL Supabase.

Courriels de test (recherche par courriel) :

| Courriel | Foyer | Membres |
|----------|-------|---------|
| `faniry.rakoto@eklesia.test` | Famille Rakoto | 2 |
| `jean.rasoa@eklesia.test` | Famille Rasoa | 3 |
| `marie.andria@eklesia.test` | Famille Andria | 1 |

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Architecture

- **Server Actions** (`app/actions/`) — seul point d'accès à la base
- **Client Supabase admin** (`lib/supabase/supabase.ts`) — service role, `server-only`
- **RLS activé** sans policies publiques — l'API anon/authenticated ne peut pas lire/écrire ; le service role contourne RLS côté serveur

## Recherche par courriel

1. L'utilisateur saisit son courriel (étape 0).
2. Si une personne avec ce courriel existe → le foyer et tous ses membres sont préremplis (mode mise à jour).
3. Sinon → saisie complète ; le courriel est prérempli sur le premier membre (mode création).

Les membres retirés du formulaire en mode édition **ne sont pas supprimés** automatiquement en base.

## Checklist de vérification

- [ ] `.env.local` configuré avec les clés Supabase
- [ ] Migrations appliquées (`households`, `persons`, index courriel)
- [ ] Courriel existant → étapes foyer et membres préremplies → modification → UPDATE en base
- [ ] Courriel inconnu → foyer vide, premier membre avec courriel prérempli → INSERT en base
- [ ] Parcours complet sur `/` : courriel → foyer → membres → message de succès
- [ ] RLS : requête REST avec la clé `anon` ne retourne pas de données (comportement attendu)
