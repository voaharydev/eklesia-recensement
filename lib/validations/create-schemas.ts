import { z } from "zod";

import { BRANCH_CODES } from "@/lib/constants/branches";
import { createRefinements } from "@/lib/validations/member-refinements";

export type ValidationTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function createRegistrationSchemas(t: ValidationTranslator) {
  const { refineAdultProfile, refineChildProfile } = createRefinements(t);

  const requiredEmail = z
    .string({ error: t("emailRequired") })
    .trim()
    .min(1, t("emailRequired"))
    .pipe(z.email({ error: t("emailInvalid") }));

  const optionalEmail = z
    .string()
    .trim()
    .pipe(
      z.union([
        z.literal(""),
        z.email({ error: t("emailInvalid") }),
      ]),
    );

  const optionalDate = z.string().optional().or(z.literal(""));

  const branchAssignmentSchema = z.object({
    branch_code: z.enum(BRANCH_CODES, { error: t("branchInvalid") }),
    role: z.string().optional(),
  });

  const branchesSchema = z
    .array(branchAssignmentSchema)
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.branch_code)) {
          ctx.addIssue({
            code: "custom",
            message: t("branchDuplicate"),
            path: [index, "branch_code"],
          });
        }
        seen.add(item.branch_code);
      });
    });

  const optionalUuid = z
    .string()
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined || value === "") return;
      const result = z.string().uuid().safeParse(value);
      if (!result.success) {
        ctx.addIssue({
          code: "custom",
          message: t("personIdInvalid"),
        });
      }
    });

  const emailLookupSchema = z.object({
    email: requiredEmail,
  });

  const householdSchema = z.object({
    name: z.string().min(1, t("householdNameRequired")),
    main_address: z.string().min(1, t("householdAddressRequired")),
  });

  const memberBaseSchema = z.object({
    id: optionalUuid,
    first_name: z.string().min(1, t("firstNameRequired")),
    last_name: z.string().min(1, t("lastNameRequired")),
    age: z.string().min(1, t("ageRequired")),
    email: optionalEmail,
    phone: z.string().optional(),
    preferred_language: z.string().min(1, t("languageRequired")),
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

  const memberSchema = memberBaseSchema.superRefine((data, ctx) => {
    refineAdultProfile(data, ctx);
  });

  const childBaseSchema = z.object({
    id: optionalUuid,
    first_name: z.string().min(1, t("firstNameRequired")),
    last_name: z.string().min(1, t("lastNameRequired")),
    age: z.string().min(1, t("ageRequired")),
    is_baptized: z.boolean(),
    baptized_since: optionalDate,
  });

  const childSchema = childBaseSchema.superRefine((data, ctx) => {
    refineChildProfile(data, ctx);
  });

  const householdPersonsSchema = z
    .object({
      members: z.array(memberSchema).min(1, t("minOneAdult")),
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

  const adultInputSchema = memberBaseSchema
    .extend({
      household_id: z.string().uuid(t("householdIdInvalid")),
    })
    .superRefine((data, ctx) => {
      refineAdultProfile(data, ctx);
    });

  const childInputSchema = childBaseSchema
    .extend({
      household_id: z.string().uuid(t("householdIdInvalid")),
    })
    .superRefine((data, ctx) => {
      refineChildProfile(data, ctx);
    });

  return {
    emailLookupSchema,
    householdSchema,
    branchAssignmentSchema,
    memberSchema,
    childSchema,
    householdPersonsSchema,
    adultInputSchema,
    childInputSchema,
  };
}

export type RegistrationSchemas = ReturnType<typeof createRegistrationSchemas>;
