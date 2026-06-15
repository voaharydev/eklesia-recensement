import type { HouseholdRole } from "@/lib/constants/person-roles";
import type { PersonBranchAssignment } from "@/types/database";

export type ImportInternalField =
  | "household_name"
  | "main_address"
  | "landline_phone"
  | "arrival_date_fjkm"
  | "first_name"
  | "last_name"
  | "civility"
  | "role"
  | "email"
  | "phone"
  | "preferred_language"
  | "is_visible_in_directory"
  | "age"
  | "is_baptized"
  | "baptized_since"
  | "is_mpiandry"
  | "mpiandry_since"
  | "is_mpandray"
  | "mpandray_since"
  | "is_sefala"
  | "sefala_since"
  | "church_assignments"
  | "branches";

export type ParsedExcelRow = {
  excelRowNumber: number;
  raw: Record<string, string>;
};

export type ImportPersonDraft = {
  excelRowNumber: number;
  householdKey: string;
  householdName: string;
  mainAddress: string;
  landlinePhone: string | null;
  arrivalDateFjkm: string | null;
  firstName: string;
  lastName: string;
  civility: string | null;
  role: HouseholdRole;
  email: string | null;
  phone: string | null;
  preferredLanguage: string;
  isVisibleInDirectory: boolean;
  isBaptized: boolean;
  baptizedSince: string | null;
  isMpiandry: boolean;
  mpiandrySince: string | null;
  isMpandray: boolean;
  mpandraySince: string | null;
  isSefala: boolean;
  sefalaSince: string | null;
  age: number;
  isChild: boolean;
  branches: PersonBranchAssignment[];
  churchAssignments: string | null;
};

export type ImportRowError = {
  excelRowNumber: number;
  message: string;
};

export type ImportReport = {
  sheetName: string;
  totalExcelRows: number;
  skippedEmptyRows: number;
  households: number;
  persons: number;
  errors: ImportRowError[];
  warnings: string[];
};

export type ImportPersistResult = ImportReport & {
  persisted: boolean;
};
