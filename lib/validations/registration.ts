import type { z } from "zod";

import { createRegistrationSchemas } from "@/lib/validations/create-schemas";

/** Schémas par défaut pour inférence de types — les formulaires utilisent createRegistrationSchemas avec la locale active. */
const defaultSchemas = createRegistrationSchemas((key) => key);

export const {
  emailLookupSchema,
  householdSchema,
  branchAssignmentSchema,
  memberSchema,
  childSchema,
  householdPersonsSchema,
  adultInputSchema,
  childInputSchema,
} = defaultSchemas;

/** @deprecated Utiliser householdPersonsSchema */
export const membersSchema = householdPersonsSchema;

/** @deprecated Utiliser adultInputSchema */
export const personInputSchema = adultInputSchema;

export { createRegistrationSchemas };
export type { ValidationTranslator } from "@/lib/validations/create-schemas";

export type BranchAssignmentFormValues = z.infer<typeof branchAssignmentSchema>;
export type EmailLookupFormValues = z.infer<typeof emailLookupSchema>;
export type HouseholdFormValues = z.infer<typeof householdSchema>;
export type MemberFormValues = z.infer<typeof memberSchema>;
export type ChildFormValues = z.infer<typeof childSchema>;
export type HouseholdPersonsFormValues = z.infer<typeof householdPersonsSchema>;
/** @deprecated Utiliser HouseholdPersonsFormValues */
export type MembersFormValues = HouseholdPersonsFormValues;
export type AdultInputValues = z.infer<typeof adultInputSchema>;
export type ChildInputValues = z.infer<typeof childInputSchema>;

export const defaultMember: MemberFormValues = {
  household_role: "autre",
  civility: "",
  first_name: "",
  last_name: "",
  age: "",
  emails: [""],
  phones: [""],
  preferred_language: "fr",
  is_visible_in_directory: true,
  is_baptized: false,
  baptized_since: "",
  is_mpiandry: false,
  mpiandry_since: "",
  is_mpandray: false,
  mpandray_since: "",
  is_mpamaky_teny: false,
  branches: [],
  church_assignments: "",
};

export const defaultChild: ChildFormValues = {
  first_name: "",
  last_name: "",
  age: "",
  is_baptized: false,
  baptized_since: "",
  is_mpamaky_teny: false,
};

export const defaultHouseholdPersons: HouseholdPersonsFormValues = {
  head: { ...defaultMember, household_role: "chef_de_famille" },
  spouse: { ...defaultMember, emails: [""], phones: [""], household_role: "conjoint" },
  otherAdults: [],
  children: [],
};

export const emptyHouseholdDefaults: HouseholdFormValues = {
  name: "",
  main_address: "",
  landline_phone: "",
  arrival_date_fjkm: "",
};

export { MIN_ADULT_AGE, MAX_CHILD_AGE } from "@/lib/constants/ages";
