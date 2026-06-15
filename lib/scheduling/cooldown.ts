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

function personEmailKey(person: Person): string {
  const email = person.email?.trim();
  if (!email) {
    throw new Error("Volontaire sans courriel.");
  }
  return normalizeEmailForLookup(email);
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
      const email = personEmailKey(person);
      if (alreadyPickedThisService.has(email)) continue;
      if (skipRecent && recentEmails.has(email)) continue;
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
