import { z } from "zod";

import { BRANCH_CODES } from "@/lib/constants/branches";
import { ADULT_FORM_HOUSEHOLD_ROLES } from "@/lib/constants/person-roles";
import { validateHouseholdRoles } from "@/lib/registration/household-role";
import { isSpouseFilled } from "@/lib/registration/spouse";
import { createRefinements } from "@/lib/validations/member-refinements";

export type ValidationTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const optionalTrimmedText = z.string().optional().or(z.literal(""));

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
    landline_phone: optionalTrimmedText,
    arrival_date_fjkm: optionalTrimmedText,
  });

  const householdRoleSchema = z.enum(ADULT_FORM_HOUSEHOLD_ROLES);

  const memberBaseSchema = z.object({
    id: optionalUuid,
    household_role: householdRoleSchema.optional(),
    civility: optionalTrimmedText,
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
    is_mpamaky_teny: z.boolean(),
    branches: branchesSchema,
    church_assignments: z.string().optional(),
  });

  const memberSchema = memberBaseSchema.superRefine((data, ctx) => {
    refineAdultProfile(data, ctx);
  });

  const spouseDraftSchema = z.object({
    id: optionalUuid,
    household_role: householdRoleSchema.optional(),
    civility: optionalTrimmedText,
    first_name: z.string().optional().or(z.literal("")),
    last_name: z.string().optional().or(z.literal("")),
    age: z.string().optional().or(z.literal("")),
    email: optionalEmail,
    phone: z.string().optional(),
    preferred_language: z.string().optional().or(z.literal("")),
    is_visible_in_directory: z.boolean(),
    is_baptized: z.boolean(),
    baptized_since: optionalDate,
    is_mpiandry: z.boolean(),
    mpiandry_since: optionalDate,
    is_mpandray: z.boolean(),
    mpandray_since: optionalDate,
    is_mpamaky_teny: z.boolean(),
    branches: branchesSchema,
    church_assignments: z.string().optional(),
  });

  const childBaseSchema = z.object({
    id: optionalUuid,
    first_name: z.string().min(1, t("firstNameRequired")),
    last_name: z.string().min(1, t("lastNameRequired")),
    age: z.string().min(1, t("ageRequired")),
    is_baptized: z.boolean(),
    baptized_since: optionalDate,
    is_mpamaky_teny: z.boolean(),
  });

  const childSchema = childBaseSchema.superRefine((data, ctx) => {
    refineChildProfile(data, ctx);
  });

  const householdPersonsSchema = z
    .object({
      head: memberSchema,
      spouse: spouseDraftSchema,
      otherAdults: z.array(memberSchema),
      children: z.array(childSchema),
    })
    .superRefine((data, ctx) => {
      refineAdultProfile(data.head, ctx, ["head"]);

      if (isSpouseFilled(data.spouse)) {
        const spouseCheck = memberSchema.safeParse(data.spouse);
        if (!spouseCheck.success) {
          spouseCheck.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ["spouse", ...(issue.path ?? [])],
            });
          });
        }
      }

      data.otherAdults.forEach((adult, index) => {
        refineAdultProfile(adult, ctx, ["otherAdults", index]);
      });

      data.children.forEach((child, index) => {
        refineChildProfile(child, ctx, ["children", index]);
      });

      const roleError = validateHouseholdRoles(data);
      if (roleError === "singleHeadRequired") {
        ctx.addIssue({
          code: "custom",
          message: t("singleHeadRequired"),
          path: ["head", "household_role"],
        });
      } else if (roleError === "singleSpouseMax") {
        ctx.addIssue({
          code: "custom",
          message: t("singleSpouseMax"),
          path: ["spouse", "household_role"],
        });
      }
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
