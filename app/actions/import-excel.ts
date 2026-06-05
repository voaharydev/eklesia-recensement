"use server";

import { revalidatePath } from "next/cache";

import {
  failure,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { runExcelImport } from "@/lib/import/persist";
import type { ImportPersistResult } from "@/lib/import/types";
import { createAdminClient } from "@/lib/supabase/supabase";

export type ImportExcelInput = {
  token: string;
  confirmReplace: boolean;
  dryRun: boolean;
  sheetName?: string;
  fileBase64: string;
};

function verifyAdminToken(token: string): boolean {
  const expected = process.env.IMPORT_ADMIN_TOKEN?.trim();
  if (!expected || expected.length < 8) return false;
  return token.trim() === expected;
}

export async function importExcelFromUpload(
  input: ImportExcelInput,
): Promise<ActionResult<ImportPersistResult>> {
  if (!verifyAdminToken(input.token)) {
    return failure("Jeton admin invalide ou non configuré.");
  }

  if (!input.confirmReplace && !input.dryRun) {
    return failure("Vous devez confirmer le remplacement des données.");
  }

  if (!input.fileBase64?.trim()) {
    return failure("Fichier manquant.");
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(input.fileBase64, "base64");
  } catch {
    return failure("Fichier invalide.");
  }

  if (buffer.length === 0) {
    return failure("Fichier vide.");
  }

  if (buffer.length > 15 * 1024 * 1024) {
    return failure("Fichier trop volumineux (max 15 Mo).");
  }

  try {
    const supabase = createAdminClient();
    const report = await runExcelImport(supabase, buffer, {
      dryRun: input.dryRun,
      sheetName: input.sheetName?.trim() || undefined,
    });

    if (report.persisted) {
      revalidatePath("/");
    }

    return success(report);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Échec de l’import Excel.";
    return failure(message);
  }
}
