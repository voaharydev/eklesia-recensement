import { isSpouseFilled } from "@/lib/registration/spouse";
import type {
  HouseholdPersonsFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";

export const ADULT_HOUSEHOLD_ROLES = [
  "chef_de_famille",
  "conjoint",
  "autre",
] as const;

export type AdultHouseholdRole = (typeof ADULT_HOUSEHOLD_ROLES)[number];

export function isAdultHouseholdRole(
  role: string,
): role is AdultHouseholdRole {
  return (ADULT_HOUSEHOLD_ROLES as readonly string[]).includes(role);
}

export function adultRoleFromPersonRole(role: string): AdultHouseholdRole {
  if (isAdultHouseholdRole(role)) return role;
  return "autre";
}

export function resolveAdultRole(
  member: MemberFormValues,
  fallback: AdultHouseholdRole,
): AdultHouseholdRole {
  const role = member.household_role;
  if (role && isAdultHouseholdRole(role)) return role;
  return fallback;
}

export type AdultRoleEntry = {
  path: string;
  role: AdultHouseholdRole;
};

export function collectAdultRoles(
  form: HouseholdPersonsFormValues,
): AdultRoleEntry[] {
  const adults: AdultRoleEntry[] = [
    {
      path: "head",
      role: resolveAdultRole(form.head, "chef_de_famille"),
    },
  ];

  if (isSpouseFilled(form.spouse)) {
    adults.push({
      path: "spouse",
      role: resolveAdultRole(form.spouse as MemberFormValues, "conjoint"),
    });
  }

  form.otherAdults.forEach((adult, index) => {
    adults.push({
      path: `otherAdults.${index}`,
      role: resolveAdultRole(adult, "autre"),
    });
  });

  return adults;
}

export type HouseholdRoleValidationError =
  | "singleHeadRequired"
  | "singleSpouseMax";

export function validateHouseholdRoles(
  form: HouseholdPersonsFormValues,
): HouseholdRoleValidationError | null {
  const adults = collectAdultRoles(form);
  const chefCount = adults.filter((a) => a.role === "chef_de_famille").length;
  const conjointCount = adults.filter((a) => a.role === "conjoint").length;

  if (chefCount !== 1) return "singleHeadRequired";
  if (conjointCount > 1) return "singleSpouseMax";
  return null;
}

export function canDemoteHead(form: HouseholdPersonsFormValues): boolean {
  const adults = collectAdultRoles(form);
  return adults.some(
    (entry) => entry.path !== "head" && entry.role === "chef_de_famille",
  );
}

export function swapAdultWithHead(
  form: HouseholdPersonsFormValues,
  source: "spouse" | number,
): HouseholdPersonsFormValues {
  const head = { ...form.head };

  if (source === "spouse") {
    const spouse = { ...(form.spouse as MemberFormValues) };
    return {
      ...form,
      head: { ...spouse, household_role: "chef_de_famille" },
      spouse: { ...head, household_role: "conjoint" },
    };
  }

  const otherAdults = [...form.otherAdults];
  const other = { ...otherAdults[source] };
  otherAdults[source] = { ...head, household_role: "autre" };

  return {
    ...form,
    head: { ...other, household_role: "chef_de_famille" },
    otherAdults,
  };
}
