import type { Person } from "@/types/database";

const ROLE_ORDER: Record<string, number> = {
  chef_de_famille: 0,
  conjoint: 1,
  autre: 2,
  enfant: 3,
};

function roleSortKey(person: Person): number {
  if (person.is_child || person.role === "enfant") {
    return ROLE_ORDER.enfant;
  }
  return ROLE_ORDER[person.role] ?? ROLE_ORDER.autre;
}

export function sortPersonsForAdmin(persons: Person[]): Person[] {
  return [...persons].sort((a, b) => {
    const roleDiff = roleSortKey(a) - roleSortKey(b);
    if (roleDiff !== 0) return roleDiff;

    const last = a.last_name.localeCompare(b.last_name, "fr");
    if (last !== 0) return last;

    const first = a.first_name.localeCompare(b.first_name, "fr");
    if (first !== 0) return first;

    return a.id.localeCompare(b.id);
  });
}

export function groupPersonsForAdmin(persons: Person[]): {
  head: Person | null;
  spouse: Person | null;
  otherAdults: Person[];
  children: Person[];
} {
  const sorted = sortPersonsForAdmin(persons);
  const children: Person[] = [];
  const otherAdults: Person[] = [];
  const adults: Person[] = [];

  for (const person of sorted) {
    if (person.is_child || person.role === "enfant") {
      children.push(person);
    } else if (person.role === "autre") {
      otherAdults.push(person);
    } else {
      adults.push(person);
    }
  }

  const head =
    adults.find((p) => p.role === "chef_de_famille") ?? adults[0] ?? null;
  const spouse =
    adults.find(
      (p) => p.role === "conjoint" && p.id !== head?.id,
    ) ?? null;

  return { head, spouse, otherAdults, children };
}
