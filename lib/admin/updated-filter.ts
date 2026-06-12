import type { MembersFilters, UpdatedPreset } from "@/lib/admin/types";

export type ResolvedUpdatedFilter =
  | {
      mode: "range";
      gte?: string;
      lte?: string;
    }
  | {
      mode: "never";
    };

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseUpdatedPreset(value: string | undefined): UpdatedPreset | undefined {
  if (value === "7d" || value === "30d" || value === "90d" || value === "never") {
    return value;
  }
  return undefined;
}

function parseDateOnly(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  return DATE_ONLY_PATTERN.test(trimmed) ? trimmed : undefined;
}

function startOfDayUtcIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function endOfDayUtcIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function subtractDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export function resolveUpdatedFilter(
  filters: Pick<MembersFilters, "updated_preset" | "updated_from" | "updated_to">,
): ResolvedUpdatedFilter | undefined {
  const from = parseDateOnly(filters.updated_from);
  const to = parseDateOnly(filters.updated_to);

  if (from || to) {
    return {
      mode: "range",
      gte: from ? startOfDayUtcIso(from) : undefined,
      lte: to ? endOfDayUtcIso(to) : undefined,
    };
  }

  switch (filters.updated_preset) {
    case "7d":
      return { mode: "range", gte: subtractDays(7) };
    case "30d":
      return { mode: "range", gte: subtractDays(30) };
    case "90d":
      return { mode: "range", gte: subtractDays(90) };
    case "never":
      return { mode: "never" };
    default:
      return undefined;
  }
}

export function hasUpdatedFilter(
  filters: Pick<MembersFilters, "updated_preset" | "updated_from" | "updated_to">,
): boolean {
  return Boolean(
    filters.updated_preset ||
      parseDateOnly(filters.updated_from) ||
      parseDateOnly(filters.updated_to),
  );
}
