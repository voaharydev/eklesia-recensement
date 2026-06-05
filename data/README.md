# Données Excel (import)

Placez votre fichier **Listing mai 2026.xlsx** ici, par exemple :

```
data/listing-mai-2026.xlsx
```

Les fichiers `.xlsx` ne sont pas versionnés (données personnelles).

## Format Merge (défaut)

Le listing mai 2026 utilise l’onglet **Merge** : **une ligne = un foyer** (chef, conjoint, jusqu’à 4 enfants en colonnes fixes). Le parseur développe chaque ligne en plusieurs personnes avant l’import.

L’onglet « Réponses au formulaire 1 (2) » n’est pas importé par défaut (structure différente). Utilisez **Merge** ou `--layout merge`.

## Commandes

```bash
# Voir le layout, mapping par indices et échantillon
npm run db:import:inspect -- data/listing-mai-2026.xlsx

# Simuler (feuille Merge par défaut)
npm run db:import -- data/listing-mai-2026.xlsx --sheet Merge --dry-run

# Importer (remplace toutes les données households + persons)
npm run db:import -- data/listing-mai-2026.xlsx --sheet Merge --yes
```

Options utiles :

- `--sheet "Nom de la feuille"` — défaut : `Merge`
- `--layout merge|long` — `merge` = 1 ligne/foyer ; `long` = 1 ligne/personne (ancien modèle)
- `--layout long` + mapping dans [`lib/import/excel-column-map.ts`](../lib/import/excel-column-map.ts) pour d’autres exports

## Interface admin

Après configuration de `IMPORT_ADMIN_TOKEN` dans `.env.local` :

`/fr/admin/import` ou `/mg/admin/import` — laisser la feuille vide pour **Merge**.
