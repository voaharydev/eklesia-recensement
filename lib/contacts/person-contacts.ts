import type { Person } from "@/types/database";

type EmailPerson = Pick<Person, "emails">;
type ContactPerson = Pick<Person, "emails" | "phones">;

export function normalizeEmailForLookup(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeEmails(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of raw) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalized = normalizeEmailForLookup(trimmed);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

export function normalizePhones(raw: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of raw) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

export function getPrimaryEmail(person: EmailPerson): string | null {
  return person.emails[0] ?? null;
}

export function getPrimaryPhone(person: ContactPerson): string | null {
  return person.phones[0] ?? null;
}

export function personHasEmail(
  person: EmailPerson,
  normalizedEmail: string,
): boolean {
  return person.emails.some(
    (email) => normalizeEmailForLookup(email) === normalizedEmail,
  );
}

export function personEmailKeys(person: EmailPerson): Set<string> {
  return new Set(person.emails.map((email) => normalizeEmailForLookup(email)));
}

export function personMatchesAnyEmail(
  person: EmailPerson,
  emails: Set<string>,
): boolean {
  for (const email of Array.from(personEmailKeys(person))) {
    if (emails.has(email)) return true;
  }
  return false;
}

export function formatEmailsDisplay(
  emails: string[],
  emptyLabel = "—",
): string {
  if (emails.length === 0) return emptyLabel;
  if (emails.length <= 2) return emails.join(", ");
  return `${emails[0]}, +${emails.length - 1}`;
}

export function formatPhonesDisplay(
  phones: string[],
  emptyLabel = "—",
): string {
  if (phones.length === 0) return emptyLabel;
  if (phones.length <= 2) return phones.join(", ");
  return `${phones[0]}, +${phones.length - 1}`;
}

export function mergeEmailLists(a: string[], b: string[]): string[] {
  return normalizeEmails([...a, ...b]);
}

export function mergePhoneLists(a: string[], b: string[]): string[] {
  return normalizePhones([...a, ...b]);
}

export function emailsForForm(person: EmailPerson): string[] {
  return person.emails.length > 0 ? [...person.emails] : [""];
}

export function phonesForForm(person: ContactPerson): string[] {
  return person.phones.length > 0 ? [...person.phones] : [""];
}
