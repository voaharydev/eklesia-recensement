import { isPowerPointBranchRole } from "@/lib/constants/branch-roles";
import { isMpamakyRole } from "@/lib/constants/service-roles";
import { normalizeEmailForLookup } from "@/lib/registration/mappers";
import type { Person, ServiceRoleCode } from "@/types/database";

/** Volontaire PowerPoint : branche vaomiera_technika avec rôle PowerPoint (preset ou texte). */
export function isPowerPointVolunteer(person: Person): boolean {
  if (person.is_child) return false;
  return person.branches.some((branch) =>
    isPowerPointBranchRole(branch.branch_code, branch.role),
  );
}

/** Volontaire Mpamaky teny : case cochée, adulte actif. */
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

/** Une fiche par courriel (ordre stable par nom) pour éviter les doublons multi-foyers. */
export function dedupeSchedulingPoolByEmail(persons: Person[]): Person[] {
  const seen = new Set<string>();
  const deduped: Person[] = [];

  for (const person of sortVolunteersByName(persons)) {
    const email = person.email?.trim();
    if (!email) continue;

    const key = normalizeEmailForLookup(email);
    if (seen.has(key)) continue;

    seen.add(key);
    deduped.push(person);
  }

  return deduped;
}

export function isPersonEligibleForRole(
  person: Person,
  roleCode: ServiceRoleCode,
): boolean {
  if (!hasEmailForScheduling(person)) return false;
  if (roleCode === "powerpoint") return isPowerPointVolunteer(person);
  if (isMpamakyRole(roleCode)) return isMpamakyTenyVolunteer(person);
  return false;
}

/** Pool de volontaires éligibles pour un rôle de culte. */
export function getSchedulingPoolForRole(
  persons: Person[],
  roleCode: ServiceRoleCode,
): Person[] {
  const withEmail = persons.filter(hasEmailForScheduling);
  if (roleCode === "powerpoint") {
    return dedupeSchedulingPoolByEmail(withEmail.filter(isPowerPointVolunteer));
  }
  if (isMpamakyRole(roleCode)) {
    return dedupeSchedulingPoolByEmail(withEmail.filter(isMpamakyTenyVolunteer));
  }
  return [];
}

/** @deprecated Préférer getSchedulingPoolForRole */
export function filterSchedulingVolunteers(
  persons: Person[],
  roleCode: ServiceRoleCode,
): Person[] {
  return getSchedulingPoolForRole(persons, roleCode);
}

export function personDisplayName(person: Person): string {
  return `${person.first_name} ${person.last_name}`.trim();
}
