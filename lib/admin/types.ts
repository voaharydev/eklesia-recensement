import type { Household, Person } from "@/types/database";

export type PersonWithHousehold = Person & {
  household: Pick<
    Household,
    "id" | "name" | "unregistered_at" | "updated_at" | "created_at"
  >;
};

export type UpdatedPreset = "7d" | "30d" | "90d" | "never";

export type DashboardMonthBucket = {
  monthKey: string;
  label: string;
  householdsCreated: number;
  membersCreated: number;
  householdsUpdated: number;
  householdsArchived: number;
  activeHouseholds: number;
  activeMembers: number;
};

export type DashboardSpiritualCounts = {
  baptized: number;
  mpiandry: number;
  mpandray: number;
  sefala: number;
  mpamakyTeny: number;
};

export type DashboardMetrics = {
  activeHouseholds: number;
  totalMembers: number;
  adultCount: number;
  childCount: number;
  baptizedCount: number;
  mpandrayCount: number;
  mpiandryCount: number;
  sefalaCount: number;
  mpamakyTenyCount: number;
  branchCounts: Record<string, number>;
  monthly: DashboardMonthBucket[];
  spiritualCounts: DashboardSpiritualCounts;
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

export type HouseholdsExportDataset = {
  households: Household[];
  members: Person[];
};

export type ExportScopeCounts = {
  householdCount: number;
  memberCount: number;
};
