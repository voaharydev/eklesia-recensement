import {
  emailsForForm,
  normalizeEmails,
  normalizePhones,
  personHasEmail,
  phonesForForm,
} from "@/lib/contacts/person-contacts";
import { resolveBranchCode } from "@/lib/constants/branches";
import {
  matchRoleToForm,
  resolveRoleForDb,
} from "@/lib/constants/branch-roles";
import type { FormHouseholdRole, HouseholdRole } from "@/lib/constants/person-roles";
import {
  adultRoleFromPersonRole,
  resolveAdultRole,
} from "@/lib/registration/household-role";
import {
  isSpouseFilled,
  optionalTextToNull,
} from "@/lib/registration/spouse";
import {
  defaultMember,
  type ChildFormValues,
  type HouseholdFormValues,
  type HouseholdPersonsFormValues,
  type MemberFormValues,
} from "@/lib/validations/registration";
import type {
  Household,
  Person,
  PersonBranchAssignment,
  PersonInsert,
} from "@/types/database";

function dateToFormValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function dateFromFormValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeBranchesForDb(
  branches: MemberFormValues["branches"],
): PersonBranchAssignment[] {
  return branches.map((entry) => {
    const role = resolveRoleForDb(entry.branch_code, {
      role_mode: entry.role_mode,
      role_preset: entry.role_preset ?? "",
      role_custom: entry.role_custom ?? "",
    });
    return {
      branch_code: entry.branch_code,
      role: role || null,
    };
  });
}

function parseBranchesFromPerson(
  branches: Person["branches"] | null | undefined,
): MemberFormValues["branches"] {
  if (!Array.isArray(branches)) return [];
  return branches.flatMap((entry) => {
    const branchCode = resolveBranchCode(entry.branch_code);
    if (!branchCode) return [];
    const roleForm = matchRoleToForm(branchCode, entry.role);
    return [
      {
        branch_code: branchCode,
        ...roleForm,
      },
    ];
  });
}

function parseRequiredAge(age: string | undefined): number {
  const trimmed = age?.trim();
  const parsed = trimmed ? Number.parseInt(trimmed, 10) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function householdToFormValues(household: Household): HouseholdFormValues {
  return {
    name: household.name,
    main_address: household.main_address,
    landline_phone: household.landline_phone ?? "",
    arrival_date_fjkm: household.arrival_date_fjkm ?? "",
  };
}

export function memberFormValuesToPersonInsert(
  member: MemberFormValues,
  householdRole: FormHouseholdRole,
): Omit<PersonInsert, "household_id"> {
  const {
    household_role: householdRoleField,
    first_name,
    last_name,
    emails,
    phones,
    preferred_language,
    is_visible_in_directory,
    is_baptized,
    baptized_since,
    is_mpiandry,
    mpiandry_since,
    is_mpandray,
    mpandray_since,
    is_sefala,
    sefala_since,
    is_mpamaky_teny,
    age,
    branches,
    church_assignments,
    civility,
  } = member;

  void householdRoleField;

  return {
    first_name,
    last_name,
    emails: normalizeEmails(emails),
    phones: normalizePhones(phones),
    preferred_language,
    is_visible_in_directory,
    is_baptized,
    baptized_since: is_baptized ? dateFromFormValue(baptized_since) : null,
    is_mpiandry,
    mpiandry_since: is_mpiandry ? dateFromFormValue(mpiandry_since) : null,
    is_mpandray,
    mpandray_since: is_mpandray ? dateFromFormValue(mpandray_since) : null,
    is_sefala,
    sefala_since: is_sefala ? dateFromFormValue(sefala_since) : null,
    is_mpamaky_teny,
    is_child: false,
    age: parseRequiredAge(age),
    branches: normalizeBranchesForDb(branches),
    church_assignments: church_assignments?.trim()
      ? church_assignments.trim()
      : null,
    civility: optionalTextToNull(civility),
    role: householdRole,
  };
}

export function childFormValuesToPersonInsert(
  child: ChildFormValues,
): Omit<PersonInsert, "household_id"> {
  const {
    first_name,
    last_name,
    age,
    is_baptized,
    baptized_since,
    is_mpamaky_teny,
  } = child;

  return {
    first_name,
    last_name,
    emails: [],
    phones: [],
    preferred_language: "fr",
    is_visible_in_directory: false,
    is_baptized,
    baptized_since: is_baptized ? dateFromFormValue(baptized_since) : null,
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: false,
    mpandray_since: null,
    is_sefala: false,
    sefala_since: null,
    is_mpamaky_teny,
    is_child: true,
    age: parseRequiredAge(age),
    branches: [],
    church_assignments: null,
    civility: null,
    role: "enfant",
  };
}

export function personToMemberFormValues(person: Person): MemberFormValues {
  return {
    id: person.id,
    household_role: adultRoleFromPersonRole(person.role),
    civility: person.civility ?? "",
    first_name: person.first_name,
    last_name: person.last_name,
    age: person.age != null ? String(person.age) : "",
    emails: emailsForForm(person),
    phones: phonesForForm(person),
    preferred_language: person.preferred_language,
    is_visible_in_directory: person.is_visible_in_directory,
    is_baptized: person.is_baptized,
    baptized_since: dateToFormValue(person.baptized_since),
    is_mpiandry: person.is_mpiandry,
    mpiandry_since: dateToFormValue(person.mpiandry_since),
    is_mpandray: person.is_mpandray,
    mpandray_since: dateToFormValue(person.mpandray_since),
    is_sefala: person.is_sefala,
    sefala_since: dateToFormValue(person.sefala_since),
    is_mpamaky_teny: person.is_mpamaky_teny,
    branches: parseBranchesFromPerson(person.branches),
    church_assignments: person.church_assignments ?? "",
  };
}

export function personToChildFormValues(person: Person): ChildFormValues {
  return {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    age: person.age != null ? String(person.age) : "",
    is_baptized: person.is_baptized,
    baptized_since: dateToFormValue(person.baptized_since),
    is_mpamaky_teny: person.is_mpamaky_teny,
  };
}

function sortAdultsForLegacy(adults: Person[]): Person[] {
  return [...adults].sort((a, b) => {
    const last = a.last_name.localeCompare(b.last_name);
    if (last !== 0) return last;
    const first = a.first_name.localeCompare(b.first_name);
    if (first !== 0) return first;
    return a.id.localeCompare(b.id);
  });
}

function pickHeadAndSpouse(adults: Person[]): {
  head: Person;
  spouse: Person | null;
} {
  const byRole = (role: HouseholdRole) =>
    adults.find((p) => p.role === role);

  const head =
    byRole("chef_de_famille") ?? sortAdultsForLegacy(adults)[0];
  if (!head) {
    throw new Error("Household has no adult member");
  }

  const spouseByRole = byRole("conjoint");
  const spouse =
    spouseByRole && spouseByRole.id !== head.id
      ? spouseByRole
      : sortAdultsForLegacy(adults).find(
          (p) => p.id !== head.id && p.role !== "autre",
        ) ?? null;

  return { head, spouse };
}

export function splitPersonsForForm(persons: Person[]): {
  head: MemberFormValues;
  spouse: MemberFormValues | null;
  otherAdults: MemberFormValues[];
  children: ChildFormValues[];
} {
  const children: ChildFormValues[] = [];
  const otherAdults: MemberFormValues[] = [];
  const adults: Person[] = [];

  for (const person of persons) {
    if (person.is_child || person.role === "enfant") {
      children.push(personToChildFormValues(person));
    } else if (person.role === "autre") {
      otherAdults.push(personToMemberFormValues(person));
    } else {
      adults.push(person);
    }
  }

  const { head, spouse } = pickHeadAndSpouse(adults);

  return {
    head: personToMemberFormValues(head),
    spouse: spouse ? personToMemberFormValues(spouse) : null,
    otherAdults,
    children,
  };
}

export type FlattenedPersonEntry =
  | { kind: "adult"; role: FormHouseholdRole; values: MemberFormValues }
  | { kind: "child"; values: ChildFormValues };

export function personsToHouseholdPersonsFormValues(
  persons: Person[],
): HouseholdPersonsFormValues {
  const { head, spouse, otherAdults, children } = splitPersonsForForm(persons);

  return {
    head,
    spouse: spouse ?? {
      ...defaultMember,
      emails: [""],
      phones: [""],
      household_role: "conjoint",
    },
    otherAdults,
    children,
  };
}

export function flattenHouseholdPersonsForm(
  form: HouseholdPersonsFormValues,
): FlattenedPersonEntry[] {
  const entries: FlattenedPersonEntry[] = [
    {
      kind: "adult",
      role: resolveAdultRole(form.head, "chef_de_famille"),
      values: form.head,
    },
  ];

  if (isSpouseFilled(form.spouse)) {
    entries.push({
      kind: "adult",
      role: resolveAdultRole(form.spouse as MemberFormValues, "conjoint"),
      values: form.spouse as MemberFormValues,
    });
  }

  for (const adult of form.otherAdults) {
    entries.push({
      kind: "adult",
      role: resolveAdultRole(adult, "autre"),
      values: adult,
    });
  }

  for (const child of form.children) {
    entries.push({ kind: "child", values: child });
  }

  return entries;
}

export { normalizeEmailForLookup } from "@/lib/contacts/person-contacts";

export function findPersonByNormalizedEmail(
  persons: Person[],
  normalizedEmail: string,
): Person | undefined {
  return persons.find((person) => personHasEmail(person, normalizedEmail));
}
