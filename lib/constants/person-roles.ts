export const HOUSEHOLD_ROLES = [
  "chef_de_famille",
  "conjoint",
  "enfant",
  "autre",
] as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[number];

export const FORM_HOUSEHOLD_ROLES = [
  "chef_de_famille",
  "conjoint",
  "autre",
  "enfant",
] as const;

export type FormHouseholdRole = (typeof FORM_HOUSEHOLD_ROLES)[number];
