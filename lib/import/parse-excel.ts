import * as XLSX from "xlsx";

import {
  detectLayout,
  resolveSheetName,
  type ImportLayout,
} from "@/lib/import/detect-layout";
import {
  DEFAULT_SHEET_NAME,
  EXCEL_HEADER_ALIASES,
} from "@/lib/import/excel-column-map";
import { inspectMergeWorkbook } from "@/lib/import/parse-merge-sheet";
import {
  cellToString,
  normalizeHeader,
  normalizeHouseholdKey,
  normalizePreferredLanguage,
  normalizeRole,
  normalizeEmail,
  parseAge,
  parseBoolean,
  parseBranchesField,
  parseDate,
  resolveAgeAndChild,
  inferRoleFromAge,
} from "@/lib/import/normalize";
import type {
  ImportInternalField,
  ImportPersonDraft,
  ImportRowError,
  ParsedExcelRow,
} from "@/lib/import/types";

export type WorkbookInspect = {
  sheetNames: string[];
  selectedSheet: string;
  headers: string[];
  sampleRows: Record<string, string>[];
  headerMapping: Partial<Record<ImportInternalField, string>>;
  unmappedHeaders: string[];
};

function buildHeaderIndex(headers: string[]): Map<ImportInternalField, number> {
  const map = new Map<ImportInternalField, number>();
  const normalizedHeaders = headers.map((h) => normalizeHeader(h));

  for (const [field, aliases] of Object.entries(EXCEL_HEADER_ALIASES) as [
    ImportInternalField,
    string[],
  ][]) {
    for (let i = 0; i < headers.length; i++) {
      const headerNorm = normalizedHeaders[i];
      const matched = aliases.some(
        (alias) => normalizeHeader(alias) === headerNorm,
      );
      if (matched) {
        map.set(field, i);
        break;
      }
    }
  }

  return map;
}

function getField(
  row: unknown[],
  indexMap: Map<ImportInternalField, number>,
  field: ImportInternalField,
): string {
  const index = indexMap.get(field);
  if (index == null) return "";
  return cellToString(row[index]);
}

export function inspectWorkbook(
  buffer: Buffer,
  sheetName = DEFAULT_SHEET_NAME,
  forcedLayout?: ImportLayout,
): WorkbookInspect | ReturnType<typeof inspectMergeWorkbook> {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const selectedSheet = resolveSheetName(workbook, sheetName);

  if (detectLayout(workbook, selectedSheet, forcedLayout) === "merge") {
    return inspectMergeWorkbook(buffer, selectedSheet);
  }

  const sheet = workbook.Sheets[selectedSheet];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const headerRow = (rows[0] ?? []).map((c) => cellToString(c));
  const indexMap = buildHeaderIndex(headerRow);

  const headerMapping: WorkbookInspect["headerMapping"] = {};
  for (const [field, index] of Array.from(indexMap.entries())) {
    headerMapping[field] = headerRow[index];
  }

  const mappedIndices = new Set(Array.from(indexMap.values()));
  const unmappedHeaders = headerRow.filter(
    (_, i) => !mappedIndices.has(i) && headerRow[i],
  );

  const sampleRows: Record<string, string>[] = [];
  for (let r = 1; r < Math.min(rows.length, 4); r++) {
    const record: Record<string, string> = {};
    headerRow.forEach((header, i) => {
      if (header) record[header] = cellToString(rows[r]?.[i]);
    });
    sampleRows.push(record);
  }

  return {
    sheetNames: workbook.SheetNames,
    selectedSheet,
    headers: headerRow.filter(Boolean),
    sampleRows,
    headerMapping,
    unmappedHeaders,
  };
}

export function parseWorkbookToRows(
  buffer: Buffer,
  sheetName = DEFAULT_SHEET_NAME,
): {
  sheetName: string;
  rows: ParsedExcelRow[];
  skippedEmpty: number;
  headerRow: string[];
  indexMap: Map<ImportInternalField, number>;
  matrix: unknown[][];
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const selectedSheet = workbook.SheetNames.includes(sheetName)
    ? sheetName
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[selectedSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  if (matrix.length < 2) {
    return {
      sheetName: selectedSheet,
      rows: [],
      skippedEmpty: 0,
      headerRow: [],
      indexMap: new Map(),
      matrix,
    };
  }

  const headerRow = (matrix[0] ?? []).map((c) => cellToString(c));
  const indexMap = buildHeaderIndex(headerRow);
  const parsed: ParsedExcelRow[] = [];
  let skippedEmpty = 0;

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const raw: Record<string, string> = {};
    let hasContent = false;

    headerRow.forEach((header, colIndex) => {
      if (!header) return;
      const value = cellToString(row[colIndex]);
      raw[header] = value;
      if (value) hasContent = true;
    });

    if (!hasContent) {
      skippedEmpty += 1;
      continue;
    }

    parsed.push({
      excelRowNumber: i + 1,
      raw,
    });
  }

  return {
    sheetName: selectedSheet,
    rows: parsed,
    skippedEmpty,
    headerRow,
    indexMap,
    matrix,
  };
}

export function rowToDraft(
  row: unknown[],
  indexMap: Map<ImportInternalField, number>,
  excelRowNumber: number,
): { draft: ImportPersonDraft | null; error: ImportRowError | null } {

  const householdName = getField(row, indexMap, "household_name");
  const mainAddress = getField(row, indexMap, "main_address");
  const firstName = getField(row, indexMap, "first_name");
  const lastName = getField(row, indexMap, "last_name");

  if (!householdName.trim()) {
    return {
      draft: null,
      error: {
        excelRowNumber,
        message: "Nom du foyer manquant.",
      },
    };
  }
  if (!mainAddress.trim()) {
    return {
      draft: null,
      error: {
        excelRowNumber,
        message: "Adresse principale manquante.",
      },
    };
  }
  if (!firstName.trim() || !lastName.trim()) {
    return {
      draft: null,
      error: {
        excelRowNumber,
        message: "Prénom et nom requis.",
      },
    };
  }

  const roleRaw = getField(row, indexMap, "role");
  const ageParsed = parseAge(getField(row, indexMap, "age"));
  let role = normalizeRole(roleRaw);
  if (!role && ageParsed != null) {
    role = inferRoleFromAge(ageParsed);
  }
  if (!role) {
    role = "autre";
  }

  const { age, isChild, role: resolvedRole } = resolveAgeAndChild(
    role,
    ageParsed,
  );

  const householdKey = normalizeHouseholdKey(householdName, mainAddress);

  const draft: ImportPersonDraft = {
    excelRowNumber,
    householdKey,
    householdName: householdName.trim(),
    mainAddress: mainAddress.trim(),
    landlinePhone:
      getField(row, indexMap, "landline_phone").trim() || null,
    arrivalDateFjkm:
      getField(row, indexMap, "arrival_date_fjkm").trim() || null,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    civility: getField(row, indexMap, "civility").trim() || null,
    role: resolvedRole,
    email: normalizeEmail(getField(row, indexMap, "email")),
    phone: getField(row, indexMap, "phone").trim() || null,
    preferredLanguage: normalizePreferredLanguage(
      getField(row, indexMap, "preferred_language"),
    ),
    isVisibleInDirectory: parseBoolean(
      getField(row, indexMap, "is_visible_in_directory"),
    ),
    isBaptized: parseBoolean(getField(row, indexMap, "is_baptized")),
    baptizedSince: parseDate(getField(row, indexMap, "baptized_since")),
    isMpiandry: parseBoolean(getField(row, indexMap, "is_mpiandry")),
    mpiandrySince: parseDate(getField(row, indexMap, "mpiandry_since")),
    isMpandray: parseBoolean(getField(row, indexMap, "is_mpandray")),
    mpandraySince: parseDate(getField(row, indexMap, "mpandray_since")),
    age,
    isChild,
    branches: parseBranchesField(getField(row, indexMap, "branches")),
    churchAssignments:
      getField(row, indexMap, "church_assignments").trim() || null,
  };

  return { draft, error: null };
}

export function parseWorkbookToDrafts(
  buffer: Buffer,
  sheetName = DEFAULT_SHEET_NAME,
): {
  sheetName: string;
  drafts: ImportPersonDraft[];
  errors: ImportRowError[];
  skippedEmpty: number;
  totalExcelRows: number;
} {
  const {
    sheetName: selected,
    rows,
    skippedEmpty,
    indexMap,
    matrix,
  } = parseWorkbookToRows(buffer, sheetName);
  const drafts: ImportPersonDraft[] = [];
  const errors: ImportRowError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const excelRow = matrix[i + 1] ?? [];
    const { draft, error } = rowToDraft(
      excelRow,
      indexMap,
      rows[i].excelRowNumber,
    );
    if (error) errors.push(error);
    else if (draft) drafts.push(draft);
  }

  return {
    sheetName: selected,
    drafts,
    errors,
    skippedEmpty,
    totalExcelRows: rows.length + skippedEmpty,
  };
}
