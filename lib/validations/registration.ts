import { z } from "zod";

import { MAX_CHILD_AGE, MIN_ADULT_AGE } from "@/lib/constants/ages";
import { BRANCH_CODES } from "@/lib/constants/branches";
import {
  refineAdultProfile,
  refineChildProfile,
} from "@/lib/validations/member-refinements";

const requiredEmail = z
  .string({ error: "Le courriel est requis." })
  .trim()
  .min(1, "Le courriel est requis.")
  .pipe(z.email({ error: "Adresse e-mail invalide." }));

const optionalEmail = z
  .string()
  .trim()
  .pipe(
    z.union([
      z.literal(""),
      z.email({ error: "Adresse e-mail invalide." }),
    ]),
  );

const optionalDate = z.string().optional().or(z.literal(""));

export const branchAssignmentSchema = z.object({
  branch_code: z.enum(BRANCH_CODES, { error: "Branche invalide." }),
  role: z.string().optional(),
});

export const branchesSchema = z.array(branchAssignmentSchema).superRefine((items, ctx) => {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    if (seen.has(item.branch_code)) {
      ctx.addIssue({
        code: "custom",
        message: "Cette branche est déjà sélectionnée.",
        path: [index, "branch_code"],
      });
    }
    seen.add(item.branch_code);
  });
});

/** UUID optionnel : vide ou absent accepté (évite « Invalid input » sur id). */
const optionalUuid = z
  .string()
  .optional()
  .superRefine((value, ctx) => {
    if (value === undefined || value === "") return;
    const result = z.string().uuid().safeParse(value);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        message: "Identifiant de personne invalide.",
      });
    }
  });

export const emailLookupSchema = z.object({
  email: requiredEmail,
});

export const householdSchema = z.object({
  name: z.string().min(1, "Le nom du foyer est requis."),
  main_address: z.string().min(1, "L'adresse principale est requise."),
});

const memberBaseSchema = z.object({
  id: optionalUuid,
  first_name: z.string().min(1, "Le prénom est requis."),
  last_name: z.string().min(1, "Le nom est requis."),
  age: z.string().min(1, "L'âge est requis."),
  email: optionalEmail,
  phone: z.string().optional(),
  preferred_language: z.string().min(1, "La langue est requise."),
  is_visible_in_directory: z.boolean(),
  is_baptized: z.boolean(),
  baptized_since: optionalDate,
  is_mpiandry: z.boolean(),
  mpiandry_since: optionalDate,
  is_mpandray: z.boolean(),
  mpandray_since: optionalDate,
  branches: branchesSchema,
  church_assignments: z.string().optional(),
});

export const memberSchema = memberBaseSchema.superRefine((data, ctx) => {
  refineAdultProfile(data, ctx);
});

const childBaseSchema = z.object({
  id: optionalUuid,
  first_name: z.string().min(1, "Le prénom est requis."),
  last_name: z.string().min(1, "Le nom est requis."),
  age: z.string().min(1, "L'âge est requis."),
  is_baptized: z.boolean(),
  baptized_since: optionalDate,
});

export const childSchema = childBaseSchema.superRefine((data, ctx) => {
  refineChildProfile(data, ctx);
});

export const householdPersonsSchema = z
  .object({
    members: z
      .array(memberSchema)
      .min(1, "Ajoutez au moins un membre adulte au foyer."),
    children: z.array(childSchema),
  })
  .superRefine((data, ctx) => {
    data.members.forEach((member, index) => {
      refineAdultProfile(member, ctx, ["members", index]);
    });
    data.children.forEach((child, index) => {
      refineChildProfile(child, ctx, ["children", index]);
    });
  });

/** @deprecated Utiliser householdPersonsSchema */
export const membersSchema = householdPersonsSchema;

export const adultInputSchema = memberBaseSchema
  .extend({
    household_id: z.string().uuid("Identifiant de foyer invalide."),
  })
  .superRefine((data, ctx) => {
    refineAdultProfile(data, ctx);
  });

export const childInputSchema = childBaseSchema
  .extend({
    household_id: z.string().uuid("Identifiant de foyer invalide."),
  })
  .superRefine((data, ctx) => {
    refineChildProfile(data, ctx);
  });

/** @deprecated Utiliser adultInputSchema */
export const personInputSchema = adultInputSchema;

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
  first_name: "",
  last_name: "",
  age: "",
  email: "",
  phone: "",
  preferred_language: "fr",
  is_visible_in_directory: true,
  is_baptized: false,
  baptized_since: "",
  is_mpiandry: false,
  mpiandry_since: "",
  is_mpandray: false,
  mpandray_since: "",
  branches: [],
  church_assignments: "",
};

export const defaultChild: ChildFormValues = {
  first_name: "",
  last_name: "",
  age: "",
  is_baptized: false,
  baptized_since: "",
};

export const defaultHouseholdPersons: HouseholdPersonsFormValues = {
  members: [defaultMember],
  children: [],
};

export { MIN_ADULT_AGE, MAX_CHILD_AGE };
