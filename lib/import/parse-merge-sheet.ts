import * as XLSX from "xlsx";

import { resolveSheetName } from "@/lib/import/detect-layout";
import {
  MERGE_SHEET_NAME,
  expandMergeRowToDrafts,
  mergeColumnMappingForInspect,
} from "@/lib/import/merge-sheet-layout";
import { cellToString } from "@/lib/import/normalize";
import type { ImportPersonDraft, ImportRowError } from "@/lib/import/types";

export type MergeWorkbookInspect = {
  layout: "merge";
  sheetNames: string[];
  selectedSheet: string;
  columnMapping: ReturnType<typeof mergeColumnMappingForInspect>;
  sampleHouseholdCounts: { excelRow: number; persons: number }[];
  unmappedSheets: string[];
};

export function inspectMergeWorkbook(
  buffer: Buffer,
  sheetName?: string,
): MergeWorkbookInspect {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const selectedSheet = resolveSheetName(workbook, sheetName ?? MERGE_SHEET_NAME);
  const sheet = workbook.Sheets[selectedSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const sampleHouseholdCounts: MergeWorkbookInspect["sampleHouseholdCounts"] = [];
  for (let i = 1; i < Math.min(matrix.length, 4); i++) {
    const row = matrix[i] ?? [];
    const { drafts } = expandMergeRowToDrafts(row, i + 1);
    sampleHouseholdCounts.push({ excelRow: i + 1, persons: drafts.length });
  }

  const unmappedSheets = workbook.SheetNames.filter((n) => n !== selectedSheet);

  return {
    layout: "merge",
    sheetNames: workbook.SheetNames,
    selectedSheet,
    columnMapping: mergeColumnMappingForInspect(),
    sampleHouseholdCounts,
    unmappedSheets,
  };
}

export function parseMergeWorkbookToDrafts(
  buffer: Buffer,
  sheetName?: string,
): {
  sheetName: string;
  drafts: ImportPersonDraft[];
  errors: ImportRowError[];
  skippedEmpty: number;
  totalExcelRows: number;
} {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const selectedSheet = resolveSheetName(workbook, sheetName ?? MERGE_SHEET_NAME);
  const sheet = workbook.Sheets[selectedSheet];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  const drafts: ImportPersonDraft[] = [];
  const errors: ImportRowError[] = [];
  let skippedEmpty = 0;

  for (let i = 1; i < matrix.length; i++) {
    const row = matrix[i] ?? [];
    const hasContent = row.some((c) => cellToString(c).trim());
    if (!hasContent) {
      skippedEmpty += 1;
      continue;
    }

    const { drafts: rowDrafts, error } = expandMergeRowToDrafts(row, i + 1);
    if (error) {
      errors.push(error);
      continue;
    }
    drafts.push(...rowDrafts);
  }

  return {
    sheetName: selectedSheet,
    drafts,
    errors,
    skippedEmpty,
    totalExcelRows: matrix.length - 1,
  };
}

export function isUnsupportedFormSheet(sheetName: string): boolean {
  return sheetName.startsWith("Réponses au formulaire");
}

export function warnIfUnsupportedSheet(sheetName: string): string | null {
  if (isUnsupportedFormSheet(sheetName)) {
    return `La feuille « ${sheetName} » n'est pas encore supportée. Utilisez --sheet Merge pour le listing consolidé.`;
  }
  return null;
}
