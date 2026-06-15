import {
  getPrimaryEmail,
  personEmailKeys,
} from "@/lib/contacts/person-contacts";
import { normalizeEmailForLookup } from "@/lib/registration/mappers";
import { pickFromPool } from "@/lib/scheduling/rotation";
import type { Person, ServiceRoleCode } from "@/types/database";

export const SCHEDULING_COOLDOWN_DAYS = 120;

export type AssignmentHistoryEntry = {
  serviceDate: string;
  email: string;
  roleCode: ServiceRoleCode;
};

export function getCooldownStartDate(serviceDate: string): string {
  const date = new Date(`${serviceDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - SCHEDULING_COOLDOWN_DAYS);
  return date.toISOString().slice(0, 10);
}

export function getRecentAssigneeEmails(
  history: AssignmentHistoryEntry[],
  serviceDate: string,
): Set<string> {
  const start = getCooldownStartDate(serviceDate);
  const recent = new Set<string>();

  for (const entry of history) {
    if (entry.serviceDate >= start && entry.serviceDate < serviceDate) {
      recent.add(normalizeEmailForLookup(entry.email));
    }
  }

  return recent;
}

function personOverlapsEmailSet(
  person: Person,
  emails: Set<string>,
): boolean {
  for (const key of Array.from(personEmailKeys(person))) {
    if (emails.has(key)) return true;
  }
  return false;
}

export function pickVolunteerForSlot(
  pool: Person[],
  preferredIndex: number,
  recentEmails: Set<string>,
  alreadyPickedThisService: Set<string>,
): Person {
  if (pool.length === 0) {
    throw new Error("Pool de volontaires vide.");
  }

  const tryPick = (skipRecent: boolean): Person | null => {
    for (let offset = 0; offset < pool.length; offset += 1) {
      const person = pickFromPool(pool, preferredIndex + offset);
      if (personEmailKeys(person).size === 0) continue;
      if (personOverlapsEmailSet(person, alreadyPickedThisService)) continue;
      if (skipRecent && personOverlapsEmailSet(person, recentEmails)) continue;
      return person;
    }
    return null;
  };

  const withCooldown = tryPick(true);
  if (withCooldown) return withCooldown;

  const withoutCooldown = tryPick(false);
  if (withoutCooldown) return withoutCooldown;

  return pickFromPool(pool, preferredIndex);
}

export function markPersonEmailsPicked(
  person: Person,
  alreadyPickedThisService: Set<string>,
): void {
  for (const key of Array.from(personEmailKeys(person))) {
    alreadyPickedThisService.add(key);
  }
}

export function getPersonInvitationEmail(person: Person): string {
  const email = getPrimaryEmail(person);
  if (!email) {
    throw new Error("Volontaire sans courriel.");
  }
  return email;
}
