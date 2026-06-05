import type { ImportInternalField } from "@/lib/import/types";

/**
 * En-têtes Excel possibles → champ interne.
 * Ajuster après `npm run db:import:inspect` si des colonnes ne matchent pas.
 */
export const EXCEL_HEADER_ALIASES: Record<ImportInternalField, string[]> = {
  household_name: [
    "Nom du foyer",
    "Foyer",
    "Famille",
    "Nom famille",
    "Nom de famille (foyer)",
    "Household",
  ],
  main_address: [
    "Adresse",
    "Adresse principale",
    "Adresse du foyer",
    "Address",
  ],
  landline_phone: [
    "Téléphone fixe",
    "Telephone fixe",
    "Tel fixe",
    "Tél. fixe",
    "Landline",
  ],
  arrival_date_fjkm: [
    "Date d'arrivée FJKM",
    "Date arrivée FJKM",
    "Arrivée FJKM Québec",
    "Arrivée FJKM",
    "Date arrivée",
    "Daty na taona nahatongavana teto amin'ny FJKM Québec",
  ],
  first_name: ["Prénom", "Prenom", "Prénom(s)", "First name"],
  last_name: ["Nom", "Nom de famille", "Last name"],
  civility: ["Civilité", "Civilite", "Titre"],
  role: ["Rôle", "Role", "Lien", "Lien familial", "Statut"],
  email: ["Courriel", "E-mail", "Email", "Mail", "Adresse e-mail"],
  phone: [
    "Téléphone",
    "Telephone",
    "Cellulaire",
    "Tél. mobile",
    "Mobile",
    "Phone",
    "Tel. Cellulaire",
  ],
  preferred_language: ["Langue", "Langue préférée", "Preferred language"],
  is_visible_in_directory: [
    "Visible annuaire",
    "Visible dans l'annuaire",
    "Annuaire",
  ],
  age: ["Âge", "Age"],
  is_baptized: ["Baptisé", "Baptise", "Baptême"],
  baptized_since: [
    "Date baptême",
    "Baptisé depuis",
    "Date de baptême",
    "Baptized since",
  ],
  is_mpiandry: ["Mpiandry", "Confirmé", "Confirmation"],
  mpiandry_since: ["Date mpiandry", "Date confirmation", "Mpiandry depuis"],
  is_mpandray: ["Mpandray", "Serviteur", "Ministère"],
  mpandray_since: ["Date mpandray", "Mpandray depuis"],
  church_assignments: [
    "Affectations église",
    "Affectations dans l'église",
    "Ministères",
    "Church assignments",
  ],
  branches: ["Branche", "Branches", "Branche(s)", "Filiale"],
};

export const DEFAULT_SHEET_NAME = "Merge";

export function listExpectedHeaders(): string[] {
  return Object.values(EXCEL_HEADER_ALIASES).flat();
}
