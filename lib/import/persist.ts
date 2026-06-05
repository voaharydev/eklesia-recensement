import type { SupabaseClient } from "@supabase/supabase-js";

import type { ImportLayout } from "@/lib/import/detect-layout";
import {
  prepareImportFromBuffer,
  toImportReport,
  type PreparedImport,
} from "@/lib/import/to-database";
import type { ImportPersistResult } from "@/lib/import/types";
import type { Database } from "@/types/database";

const HOUSEHOLD_BATCH = 50;
const PERSON_BATCH = 200;

async function deleteAllData(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const { error: personsError } = await supabase
    .from("persons")
    .delete()
    .not("household_id", "is", null);

  if (personsError) {
    throw new Error(personsError.message);
  }

  const { error: householdsError } = await supabase
    .from("households")
    .delete()
    .not("name", "is", null);

  if (householdsError) {
    throw new Error(householdsError.message);
  }
}

async function insertBatches(
  supabase: SupabaseClient<Database>,
  prepared: PreparedImport,
): Promise<void> {
  for (let i = 0; i < prepared.households.length; i += HOUSEHOLD_BATCH) {
    const batch = prepared.households.slice(i, i + HOUSEHOLD_BATCH);
    const { error } = await supabase.from("households").insert(batch);
    if (error) throw new Error(error.message);
  }

  for (let i = 0; i < prepared.persons.length; i += PERSON_BATCH) {
    const batch = prepared.persons.slice(i, i + PERSON_BATCH);
    const { error } = await supabase.from("persons").insert(batch);
    if (error) throw new Error(error.message);
  }
}

export async function runExcelImport(
  supabase: SupabaseClient<Database>,
  buffer: Buffer,
  options: {
    dryRun?: boolean;
    sheetName?: string;
    layout?: ImportLayout;
  } = {},
): Promise<ImportPersistResult> {
  const prepared = prepareImportFromBuffer(buffer, {
    sheetName: options.sheetName,
    layout: options.layout,
  });
  const report = toImportReport(prepared);

  if (prepared.errors.length > 0) {
    return report;
  }

  if (options.dryRun) {
    return report;
  }

  if (prepared.householdCount === 0) {
    report.warnings.push("Aucun foyer à importer.");
    return report;
  }

  await deleteAllData(supabase);
  await insertBatches(supabase, prepared);

  return { ...report, persisted: true };
}
