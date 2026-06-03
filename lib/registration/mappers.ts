import { resolveBranchCode } from "@/lib/constants/branches";
import type {
  ChildFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type {
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
  return branches.map((entry) => ({
    branch_code: entry.branch_code,
    role: entry.role?.trim() ? entry.role.trim() : null,
  }));
}

function parseBranchesFromPerson(
  branches: Person["branches"] | null | undefined,
): MemberFormValues["branches"] {
  if (!Array.isArray(branches)) return [];
  return branches.flatMap((entry) => {
    const branchCode = resolveBranchCode(entry.branch_code);
    if (!branchCode) return [];
    return [
      {
        branch_code: branchCode,
        role: entry.role ?? "",
      },
    ];
  });
}

function parseRequiredAge(age: string | undefined): number {
  const trimmed = age?.trim();
  const parsed = trimmed ? Number.parseInt(trimmed, 10) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function memberFormValuesToPersonInsert(
  member: MemberFormValues,
): Omit<PersonInsert, "household_id"> {
  const {
    first_name,
    last_name,
    email,
    phone,
    preferred_language,
    is_visible_in_directory,
    is_baptized,
    baptized_since,
    is_mpiandry,
    mpiandry_since,
    is_mpandray,
    mpandray_since,
    age,
    branches,
    church_assignments,
  } = member;

  return {
    first_name,
    last_name,
    email: email?.trim() ? email.trim() : null,
    phone: phone?.trim() ? phone.trim() : null,
    preferred_language,
    is_visible_in_directory,
    is_baptized,
    baptized_since: is_baptized ? dateFromFormValue(baptized_since) : null,
    is_mpiandry,
    mpiandry_since: is_mpiandry ? dateFromFormValue(mpiandry_since) : null,
    is_mpandray,
    mpandray_since: is_mpandray ? dateFromFormValue(mpandray_since) : null,
    is_child: false,
    age: parseRequiredAge(age),
    branches: normalizeBranchesForDb(branches),
    church_assignments: church_assignments?.trim()
      ? church_assignments.trim()
      : null,
  };
}

export function childFormValuesToPersonInsert(
  child: ChildFormValues,
): Omit<PersonInsert, "household_id"> {
  const { first_name, last_name, age, is_baptized, baptized_since } = child;

  return {
    first_name,
    last_name,
    email: null,
    phone: null,
    preferred_language: "fr",
    is_visible_in_directory: false,
    is_baptized,
    baptized_since: is_baptized ? dateFromFormValue(baptized_since) : null,
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: false,
    mpandray_since: null,
    is_child: true,
    age: parseRequiredAge(age),
    branches: [],
    church_assignments: null,
  };
}

export function personToMemberFormValues(person: Person): MemberFormValues {
  return {
    id: person.id,
    first_name: person.first_name,
    last_name: person.last_name,
    age: person.age != null ? String(person.age) : "",
    email: person.email ?? "",
    phone: person.phone ?? "",
    preferred_language: person.preferred_language,
    is_visible_in_directory: person.is_visible_in_directory,
    is_baptized: person.is_baptized,
    baptized_since: dateToFormValue(person.baptized_since),
    is_mpiandry: person.is_mpiandry,
    mpiandry_since: dateToFormValue(person.mpiandry_since),
    is_mpandray: person.is_mpandray,
    mpandray_since: dateToFormValue(person.mpandray_since),
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
  };
}

export function splitPersonsForForm(persons: Person[]): {
  members: MemberFormValues[];
  children: ChildFormValues[];
} {
  const members: MemberFormValues[] = [];
  const children: ChildFormValues[] = [];

  for (const person of persons) {
    if (person.is_child) {
      children.push(personToChildFormValues(person));
    } else {
      members.push(personToMemberFormValues(person));
    }
  }

  return { members, children };
}

export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}
