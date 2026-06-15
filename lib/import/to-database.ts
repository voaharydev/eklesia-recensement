import { randomUUID } from "node:crypto";

import { resolveBranchCode } from "@/lib/constants/branches";
import { matchRoleToForm } from "@/lib/constants/branch-roles";
import type { FormHouseholdRole } from "@/lib/constants/person-roles";
import { groupDraftsByHousehold } from "@/lib/import/group-households";
import {
  detectLayout,
  resolveSheetName,
  type ImportLayout,
} from "@/lib/import/detect-layout";
import { parseWorkbookToDrafts } from "@/lib/import/parse-excel";
import { parseMergeWorkbookToDrafts } from "@/lib/import/parse-merge-sheet";
import * as XLSX from "xlsx";
import type {
  ImportPersistResult,
  ImportPersonDraft,
  ImportRowError,
} from "@/lib/import/types";
import {
  childFormValuesToPersonInsert,
  memberFormValuesToPersonInsert,
} from "@/lib/registration/mappers";
import type {
  ChildFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type { HouseholdInsert, PersonInsert } from "@/types/database";

export type PreparedImport = {
  sheetName: string;
  totalExcelRows: number;
  skippedEmptyRows: number;
  households: HouseholdInsert[];
  persons: PersonInsert[];
  errors: ImportRowError[];
  warnings: string[];
  householdCount: number;
  personCount: number;
};

function draftToMemberFormValues(draft: ImportPersonDraft): MemberFormValues {
  return {
    civility: draft.civility ?? "",
    first_name: draft.firstName,
    last_name: draft.lastName,
    age: String(draft.age),
    emails: draft.email ? [draft.email] : [""],
    phones: draft.phone ? [draft.phone] : [""],
    preferred_language: draft.preferredLanguage,
    is_visible_in_directory: draft.isVisibleInDirectory,
    is_baptized: draft.isBaptized,
    baptized_since: draft.baptizedSince ?? "",
    is_mpiandry: draft.isMpiandry,
    mpiandry_since: draft.mpiandrySince ?? "",
    is_mpandray: draft.isMpandray,
    mpandray_since: draft.mpandraySince ?? "",
    is_sefala: draft.isSefala,
    sefala_since: draft.sefalaSince ?? "",
    is_mpamaky_teny: false,
    branches: draft.branches.flatMap((b) => {
      const code = resolveBranchCode(b.branch_code);
      if (!code) return [];
      return [{ branch_code: code, ...matchRoleToForm(code, b.role) }];
    }),
    church_assignments: draft.churchAssignments ?? "",
  };
}

function draftToChildFormValues(draft: ImportPersonDraft): ChildFormValues {
  return {
    first_name: draft.firstName,
    last_name: draft.lastName,
    age: String(draft.age),
    is_baptized: draft.isBaptized,
    baptized_since: draft.baptizedSince ?? "",
    is_mpamaky_teny: false,
  };
}

function ensureHouseholdRoles(persons: ImportPersonDraft[]): string[] {
  const warnings: string[] = [];
  const adults = persons.filter((p) => !p.isChild);
  const hasHead = adults.some((p) => p.role === "chef_de_famille");
  if (!hasHead && adults.length > 0) {
    adults[0].role = "chef_de_famille";
    warnings.push(
      `Foyer « ${persons[0]?.householdName} » : chef de famille déduit sur le premier adulte.`,
    );
  }
  return warnings;
}

export type PrepareImportOptions = {
  sheetName?: string;
  layout?: ImportLayout;
};

function parseDraftsFromBuffer(
  buffer: Buffer,
  options: PrepareImportOptions = {},
): {
  sheetName: string;
  drafts: ImportPersonDraft[];
  errors: ImportRowError[];
  skippedEmpty: number;
  totalExcelRows: number;
  layout: ImportLayout;
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const selected = resolveSheetName(workbook, options.sheetName);
  const layout = detectLayout(workbook, selected, options.layout);

  if (layout === "merge") {
    const result = parseMergeWorkbookToDrafts(buffer, selected);
    return { ...result, layout: "merge" };
  }

  const result = parseWorkbookToDrafts(buffer, selected);
  return { ...result, layout: "long" };
}

export function prepareImportFromBuffer(
  buffer: Buffer,
  sheetNameOrOptions?: string | PrepareImportOptions,
): PreparedImport {
  const options: PrepareImportOptions =
    typeof sheetNameOrOptions === "string"
      ? { sheetName: sheetNameOrOptions }
      : (sheetNameOrOptions ?? {});

  const {
    sheetName: selected,
    drafts,
    errors,
    skippedEmpty,
    totalExcelRows,
    layout,
  } = parseDraftsFromBuffer(buffer, options);

  const warnings: string[] = [];
  if (layout === "long") {
    warnings.push("Format long (une ligne = une personne).");
  } else {
    warnings.push("Format Merge (une ligne = un foyer, expansion chef/conjoint/enfants).");
  }
  const groups = groupDraftsByHousehold(drafts);

  for (const group of groups) {
    warnings.push(...ensureHouseholdRoles(group.persons));
  }

  const households: HouseholdInsert[] = [];
  const persons: PersonInsert[] = [];

  for (const group of groups) {
    const householdId = randomUUID();
    households.push({
      id: householdId,
      name: group.name,
      main_address: group.mainAddress,
      landline_phone: group.landlinePhone,
      arrival_date_fjkm: group.arrivalDateFjkm,
      unregistered_at: null,
    });

    for (const person of group.persons) {
      if (person.isChild) {
        const childValues = draftToChildFormValues(person);
        persons.push({
          household_id: householdId,
          ...childFormValuesToPersonInsert(childValues),
        });
      } else {
        const memberValues = draftToMemberFormValues(person);
        persons.push({
          household_id: householdId,
          ...memberFormValuesToPersonInsert(
            memberValues,
            person.role as FormHouseholdRole,
          ),
        });
      }
    }
  }

  return {
    sheetName: selected,
    totalExcelRows,
    skippedEmptyRows: skippedEmpty,
    households,
    persons,
    errors,
    warnings,
    householdCount: households.length,
    personCount: persons.length,
  };
}

export function toImportReport(prepared: PreparedImport): ImportPersistResult {
  return {
    sheetName: prepared.sheetName,
    totalExcelRows: prepared.totalExcelRows,
    skippedEmptyRows: prepared.skippedEmptyRows,
    households: prepared.householdCount,
    persons: prepared.personCount,
    errors: prepared.errors,
    warnings: prepared.warnings,
    persisted: false,
  };
}
