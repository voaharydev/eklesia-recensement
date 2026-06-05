import * as XLSX from "xlsx";

import { MERGE_SHEET_NAME, isMergeSheetLayout } from "@/lib/import/merge-sheet-layout";
import { cellToString } from "@/lib/import/normalize";
import { DEFAULT_SHEET_NAME } from "@/lib/import/excel-column-map";

export type ImportLayout = "merge" | "long";

export function resolveSheetName(
  workbook: XLSX.WorkBook,
  sheetName?: string,
): string {
  if (sheetName && workbook.SheetNames.includes(sheetName)) {
    return sheetName;
  }
  if (workbook.SheetNames.includes(DEFAULT_SHEET_NAME)) {
    return DEFAULT_SHEET_NAME;
  }
  if (workbook.SheetNames.includes(MERGE_SHEET_NAME)) {
    return MERGE_SHEET_NAME;
  }
  return workbook.SheetNames[0];
}

export function detectLayout(
  workbook: XLSX.WorkBook,
  sheetName: string,
  forcedLayout?: ImportLayout,
): ImportLayout {
  if (forcedLayout) return forcedLayout;
  if (sheetName === MERGE_SHEET_NAME) return "merge";

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return "long";

  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  const headerRow = (matrix[0] ?? []).map((c) => cellToString(c));
  if (isMergeSheetLayout(headerRow)) return "merge";
  return "long";
}
