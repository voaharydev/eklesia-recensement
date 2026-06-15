import type { BranchRoleCode } from "@/lib/constants/branch-roles";
import { BRANCH_ROLE_CANONICAL_LABELS } from "@/lib/constants/branch-roles";
import { resolveBranchCode } from "@/lib/constants/branches";
import type {
  CommunicationChannel,
  CommunicationFilters,
  SpiritualFilter,
} from "@/types/communication";

export type CommunicationSearchParams = {
  ageMin?: string;
  ageMax?: string;
  branch?: string;
  branchRole?: string;
  spiritual?: string;
  profile?: string;
  householdId?: string;
  householdName?: string;
  channel?: string;
};

export const SPIRITUAL_FILTER_OPTIONS = [
  "mpandray",
  "mpiandry",
  "sefala",
  "baptized",
  "mpamaky_teny",
] as const satisfies readonly SpiritualFilter[];

export const BRANCH_ROLE_FILTER_CODES = Object.keys(
  BRANCH_ROLE_CANONICAL_LABELS,
) as BranchRoleCode[];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parsePositiveInt(value?: string): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function parseSpiritual(value?: string): SpiritualFilter | undefined {
  if (!value?.trim()) return undefined;
  if ((SPIRITUAL_FILTER_OPTIONS as readonly string[]).includes(value)) {
    return value as SpiritualFilter;
  }
  return undefined;
}

function parseBranchRole(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  if ((BRANCH_ROLE_FILTER_CODES as readonly string[]).includes(value)) {
    return value;
  }
  return undefined;
}

function parseProfile(
  value?: string,
): Pick<CommunicationFilters, "spiritual" | "branchRole"> {
  if (!value?.trim()) return {};

  if (value.startsWith("role:")) {
    const role = parseBranchRole(value.slice(5));
    return role ? { branchRole: role } : {};
  }

  if (value.startsWith("spiritual:")) {
    const spiritual = parseSpiritual(value.slice(10));
    return spiritual ? { spiritual } : {};
  }

  const spiritual = parseSpiritual(value);
  if (spiritual) return { spiritual };

  const role = parseBranchRole(value);
  if (role) return { branchRole: role };

  return {};
}

function parseChannel(value?: string): CommunicationChannel {
  return value === "sms" ? "sms" : "email";
}

export function parseCommunicationFilters(
  searchParams: CommunicationSearchParams,
): CommunicationFilters {
  const profile = parseProfile(searchParams.profile);
  const spiritual =
    parseSpiritual(searchParams.spiritual) ?? profile.spiritual;
  const branchRole =
    parseBranchRole(searchParams.branchRole) ?? profile.branchRole;

  const branchCode = searchParams.branch?.trim();
  const resolvedBranch = branchCode ? resolveBranchCode(branchCode) : null;

  const householdId = searchParams.householdId?.trim();
  const parsedHouseholdId =
    householdId && UUID_PATTERN.test(householdId) ? householdId : undefined;

  return {
    ageMin: parsePositiveInt(searchParams.ageMin),
    ageMax: parsePositiveInt(searchParams.ageMax),
    branch: resolvedBranch ?? undefined,
    branchRole,
    spiritual,
    householdId: parsedHouseholdId,
    channel: parseChannel(searchParams.channel),
  };
}

export function hasActiveCommunicationFilters(
  filters: CommunicationFilters,
): boolean {
  return Boolean(
    filters.ageMin !== undefined ||
      filters.ageMax !== undefined ||
      filters.branch ||
      filters.branchRole ||
      filters.spiritual ||
      filters.householdId,
  );
}

export function communicationFiltersToSearchParams(
  filters: CommunicationFilters,
  householdName?: string,
): Record<string, string | undefined> {
  const profile = filters.spiritual
    ? `spiritual:${filters.spiritual}`
    : filters.branchRole
      ? `role:${filters.branchRole}`
      : undefined;

  return {
    ageMin:
      filters.ageMin !== undefined ? String(filters.ageMin) : undefined,
    ageMax:
      filters.ageMax !== undefined ? String(filters.ageMax) : undefined,
    branch: filters.branch,
    profile,
    householdId: filters.householdId,
    householdName: filters.householdId ? householdName : undefined,
    channel: filters.channel === "sms" ? "sms" : undefined,
  };
}
