import { isPowerPointBranchRole } from "@/lib/constants/branch-roles";
import type { Person, ServiceRoleCode } from "@/types/database";

/** Volontaire PowerPoint : branche vaomiera_technika avec rôle PowerPoint (preset ou texte). */
export function isPowerPointVolunteer(person: Person): boolean {
  if (person.is_child) return false;
  return person.branches.some((branch) =>
    isPowerPointBranchRole(branch.branch_code, branch.role),
  );
}

/** Volontaire Mpamaky teny : flag booléen existant, adulte actif. */
export function isMpamakyTenyVolunteer(person: Person): boolean {
  return !person.is_child && person.is_mpamaky_teny;
}

export function hasEmailForScheduling(person: Person): boolean {
  return Boolean(person.email?.trim());
}

export function sortVolunteersByName(persons: Person[]): Person[] {
  return [...persons].sort((a, b) => {
    const last = a.last_name.localeCompare(b.last_name, "fr");
    if (last !== 0) return last;
    return a.first_name.localeCompare(b.first_name, "fr");
  });
}

export function filterSchedulingVolunteers(
  persons: Person[],
  roleCode: ServiceRoleCode,
): Person[] {
  const pool = persons.filter(hasEmailForScheduling);
  if (roleCode === "powerpoint") {
    return sortVolunteersByName(pool.filter(isPowerPointVolunteer));
  }
  return sortVolunteersByName(pool.filter(isMpamakyTenyVolunteer));
}

export function personDisplayName(person: Person): string {
  return `${person.first_name} ${person.last_name}`.trim();
}
