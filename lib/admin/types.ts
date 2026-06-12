import type { Household, Person } from "@/types/database";

export type PersonWithHousehold = Person & {
  household: Pick<
    Household,
    "id" | "name" | "unregistered_at" | "updated_at" | "created_at"
  >;
};

export type UpdatedPreset = "7d" | "30d" | "90d" | "never";

export type DashboardMetrics = {
  activeHouseholds: number;
  totalMembers: number;
  adultCount: number;
  childCount: number;
  baptizedCount: number;
  mpandrayCount: number;
  mpiandryCount: number;
  mpamakyTenyCount: number;
  branchCounts: Record<string, number>;
};

export type MembersFilters = {
  search?: string;
  role?: string;
  is_child?: boolean;
  branch_code?: string;
  status?: "active" | "archived";
  updated_preset?: UpdatedPreset;
  updated_from?: string;
  updated_to?: string;
};

export type PaginatedMembers = {
  rows: PersonWithHousehold[];
  total: number;
  page: number;
  pageSize: number;
};

export type HouseholdDetail = {
  household: Household;
  members: Person[];
};

export type GroupedHouseholdMembers = {
  head: Person | null;
  spouse: Person | null;
  otherAdults: Person[];
  children: Person[];
};
