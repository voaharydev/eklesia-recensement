import type { DashboardMonthBucket } from "@/lib/admin/types";

export type DashboardHouseholdRow = {
  id: string;
  created_at: string;
  updated_at: string;
  unregistered_at: string | null;
};

export type DashboardPersonRow = {
  id: string;
  created_at: string;
  household_id: string;
  household: {
    created_at: string;
    unregistered_at: string | null;
  };
};

export function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function formatMonthLabel(monthKey: string, locale = "fr-FR"): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function buildLastSixMonthBuckets(
  referenceDate = new Date(),
): { monthKey: string; label: string }[] {
  const buckets: { monthKey: string; label: string }[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - offset,
      1,
    );
    const monthKey = toMonthKey(date);
    buckets.push({
      monthKey,
      label: formatMonthLabel(monthKey),
    });
  }

  return buckets;
}

function monthEndDate(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0, 23, 59, 59, 999);
}

function isInMonth(iso: string, monthKey: string): boolean {
  return toMonthKey(new Date(iso)) === monthKey;
}

function isHouseholdActiveAt(
  household: Pick<DashboardHouseholdRow, "created_at" | "unregistered_at">,
  at: Date,
): boolean {
  const createdAt = new Date(household.created_at);
  if (createdAt > at) {
    return false;
  }

  if (household.unregistered_at) {
    const unregisteredAt = new Date(household.unregistered_at);
    if (unregisteredAt <= at) {
      return false;
    }
  }

  return true;
}

function countsAsHouseholdUpdate(
  household: DashboardHouseholdRow,
  monthKey: string,
): boolean {
  if (household.unregistered_at) {
    return false;
  }

  if (!isInMonth(household.updated_at, monthKey)) {
    return false;
  }

  if (isInMonth(household.created_at, monthKey)) {
    return (
      new Date(household.updated_at).getTime() >
      new Date(household.created_at).getTime()
    );
  }

  return true;
}

export function buildDashboardMonthly(
  households: DashboardHouseholdRow[],
  persons: DashboardPersonRow[],
  referenceDate = new Date(),
): DashboardMonthBucket[] {
  const bucketDefs = buildLastSixMonthBuckets(referenceDate);
  const householdById = new Map(households.map((row) => [row.id, row]));

  return bucketDefs.map((bucket) => {
    const monthEnd = monthEndDate(bucket.monthKey);

    const householdsCreated = households.filter((row) =>
      isInMonth(row.created_at, bucket.monthKey),
    ).length;

    const membersCreated = persons.filter((row) =>
      isInMonth(row.created_at, bucket.monthKey),
    ).length;

    const householdsUpdated = households.filter((row) =>
      countsAsHouseholdUpdate(row, bucket.monthKey),
    ).length;

    const householdsArchived = households.filter(
      (row) =>
        row.unregistered_at && isInMonth(row.unregistered_at, bucket.monthKey),
    ).length;

    const activeHouseholds = households.filter((row) =>
      isHouseholdActiveAt(row, monthEnd),
    ).length;

    const activeMembers = persons.filter((person) => {
      const household =
        householdById.get(person.household_id) ?? person.household;
      if (!household) return false;
      if (new Date(person.created_at) > monthEnd) return false;
      return isHouseholdActiveAt(household, monthEnd);
    }).length;

    return {
      monthKey: bucket.monthKey,
      label: bucket.label,
      householdsCreated,
      membersCreated,
      householdsUpdated,
      householdsArchived,
      activeHouseholds,
      activeMembers,
    };
  });
}
