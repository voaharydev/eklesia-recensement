import type { Person } from "@/types/database";

export type PersonTimestamps = {
  createdAt: string;
  updatedAt: string;
};

export type PersonTimestampsMap = Record<string, PersonTimestamps>;

export type HouseholdTimestamps = {
  createdAt: string;
  updatedAt: string;
};

export function buildPersonTimestampsMap(
  persons: Pick<Person, "id" | "created_at" | "updated_at">[],
): PersonTimestampsMap {
  return Object.fromEntries(
    persons.map((person) => [
      person.id,
      {
        createdAt: person.created_at,
        updatedAt: person.updated_at,
      },
    ]),
  );
}

export function householdToTimestamps(household: {
  created_at: string;
  updated_at: string;
}): HouseholdTimestamps {
  return {
    createdAt: household.created_at,
    updatedAt: household.updated_at,
  };
}
