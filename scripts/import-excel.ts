#!/usr/bin/env npx tsx
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createClient } from "@supabase/supabase-js";

import type { ImportLayout } from "@/lib/import/detect-layout";
import { warnIfUnsupportedSheet } from "@/lib/import/parse-merge-sheet";
import {
  inspectWorkbook,
  type WorkbookInspect,
} from "@/lib/import/parse-excel";
import { loadEnvLocal } from "@/lib/import/load-env";
import { runExcelImport } from "@/lib/import/persist";
import type { Database } from "@/types/database";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function printUsage(): void {
  console.log(`
Usage:
  npm run db:import:inspect -- <fichier.xlsx>
  npm run db:import -- <fichier.xlsx> [--dry-run] [--yes] [--sheet Merge] [--layout merge|long]

Options:
  --inspect     Alias de db:import:inspect
  --dry-run     Parse et rapport sans écriture en base
  --yes         Pas de confirmation interactive (remplace toutes les données)
  --sheet       Nom de la feuille Excel (défaut: Merge)
  --layout      merge (1 ligne/foyer) ou long (1 ligne/personne) ; auto par défaut
`);
}

function parseArgs(argv: string[]): {
  mode: "inspect" | "import";
  filePath: string | null;
  dryRun: boolean;
  yes: boolean;
  sheetName?: string;
  layout?: ImportLayout;
} {
  const args = argv.filter((a) => a !== "--");
  let mode: "inspect" | "import" = "import";
  let dryRun = false;
  let yes = false;
  let sheetName: string | undefined;
  let layout: ImportLayout | undefined;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--inspect") mode = "inspect";
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--yes") yes = true;
    else if (arg.startsWith("--sheet=")) sheetName = arg.slice("--sheet=".length);
    else if (arg.startsWith("--layout=")) {
      const v = arg.slice("--layout=".length);
      if (v === "merge" || v === "long") layout = v;
    } else if (arg === "--sheet" || arg === "--layout") {
      /* next handled below */
    } else if (!arg.startsWith("--")) positional.push(arg);
  }

  const sheetIndex = args.indexOf("--sheet");
  if (sheetIndex >= 0 && args[sheetIndex + 1]) {
    sheetName = args[sheetIndex + 1];
  }
  const layoutIndex = args.indexOf("--layout");
  if (layoutIndex >= 0 && args[layoutIndex + 1]) {
    const v = args[layoutIndex + 1];
    if (v === "merge" || v === "long") layout = v;
  }

  if (process.env.npm_lifecycle_event === "db:import:inspect") {
    mode = "inspect";
  }

  const filePath = positional[0] ? resolve(process.cwd(), positional[0]) : null;

  return { mode, filePath, dryRun, yes, sheetName, layout };
}

async function confirmReplace(): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(
    "Cela supprimera TOUTES les données households/persons. Continuer ? (oui/non) ",
  );
  rl.close();
  return answer.trim().toLowerCase() === "oui";
}

function printInspectReport(
  inspect: ReturnType<typeof inspectWorkbook>,
): void {
  console.log("Feuilles:", inspect.sheetNames.join(", "));
  console.log("Feuille utilisée:", inspect.selectedSheet);

  const sheetWarn = warnIfUnsupportedSheet(inspect.selectedSheet);
  if (sheetWarn) {
    console.log("\nNote:", sheetWarn);
  }

  if ("layout" in inspect && inspect.layout === "merge") {
    console.log("\nFormat: Merge (1 ligne = 1 foyer → chef + conjoint + enfants)");
    console.log("\nMapping par indices:");
    inspect.columnMapping.forEach((col) => {
      console.log(`  [${col.index}] ${col.label} → ${col.usage}`);
    });
    if (inspect.unmappedSheets.length) {
      console.log("\nAutres feuilles (non importées par défaut):");
      inspect.unmappedSheets.forEach((s) => console.log(`  - ${s}`));
    }
    console.log("\nPersonnes générées (échantillon):");
    inspect.sampleHouseholdCounts.forEach((s) => {
      console.log(`  Ligne ${s.excelRow}: ${s.persons} personne(s)`);
    });
    return;
  }

  printLongInspectReport(inspect as WorkbookInspect);
}

function printLongInspectReport(inspect: WorkbookInspect): void {
  console.log("\nFormat: long (1 ligne = 1 personne)");
  console.log("\nEn-têtes détectées:");
  inspect.headers.forEach((h) => console.log(`  - ${h}`));
  console.log("\nMapping colonnes → champs internes:");
  for (const [field, header] of Object.entries(inspect.headerMapping)) {
    console.log(`  ${field}: « ${header} »`);
  }
  if (inspect.unmappedHeaders.length) {
    console.log("\nColonnes non mappées:");
    inspect.unmappedHeaders.forEach((h) => console.log(`  - ${h}`));
  }
  console.log("\nExemples (3 premières lignes):");
  inspect.sampleRows.forEach((row, i) => {
    console.log(`--- Ligne ${i + 2} ---`);
    console.log(JSON.stringify(row, null, 2));
  });
}

function printImportReport(
  report: Awaited<ReturnType<typeof runExcelImport>>,
): void {
  console.log(`Feuille: ${report.sheetName}`);
  console.log(`Lignes Excel (hors vides): ${report.totalExcelRows}`);
  console.log(`Lignes vides ignorées: ${report.skippedEmptyRows}`);
  console.log(`Foyers: ${report.households}`);
  console.log(`Personnes: ${report.persons}`);
  console.log(`Persisté: ${report.persisted ? "oui" : "non"}`);

  if (report.warnings.length) {
    console.log("\nAvertissements:");
    report.warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (report.errors.length) {
    console.log("\nErreurs:");
    report.errors.forEach((e) =>
      console.log(`  Ligne ${e.excelRowNumber}: ${e.message}`),
    );
  }
}

async function main(): Promise<void> {
  const { mode, filePath, dryRun, yes, sheetName, layout } = parseArgs(
    process.argv.slice(2),
  );

  if (!filePath) {
    printUsage();
    process.exit(1);
  }

  const buffer = readFileSync(filePath);

  if (mode === "inspect") {
    const inspect = inspectWorkbook(buffer, sheetName, layout);
    printInspectReport(inspect);
    return;
  }

  if (!dryRun && !yes) {
    const ok = await confirmReplace();
    if (!ok) {
      console.log("Import annulé.");
      process.exit(0);
    }
  }

  if (dryRun) {
    loadEnvLocal(root);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Variables Supabase manquantes dans .env.local");
      process.exit(1);
    }
    const supabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const report = await runExcelImport(supabase, buffer, {
      dryRun: true,
      sheetName,
      layout,
    });
    printImportReport(report);
    if (report.errors.length > 0) process.exit(1);
    return;
  }

  loadEnvLocal(root);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Variables Supabase manquantes dans .env.local");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report = await runExcelImport(supabase, buffer, { sheetName, layout });
  printImportReport(report);
  if (report.errors.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Échec:", err instanceof Error ? err.message : err);
  process.exit(1);
});
