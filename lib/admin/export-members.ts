import JSZip from "jszip";
import * as XLSX from "xlsx";

import type { HouseholdsExportDataset } from "@/lib/admin/types";
import { getBranchLabel } from "@/lib/constants/branches";
import type { Household, Person } from "@/types/database";

export type HouseholdExportRow = {
  "ID foyer": string;
  Nom: string;
  Adresse: string;
  "Tél. fixe": string;
  "Arrivée FJKM": string;
  "Créé le": string;
  "MAJ foyer": string;
  Statut: string;
  "Désinscrit le": string;
};

export type MemberExportRow = {
  "ID membre": string;
  "ID foyer": string;
  Civilité: string;
  Nom: string;
  Prénom: string;
  Rôle: string;
  Enfant: string;
  Âge: string;
  Courriel: string;
  Téléphone: string;
  Langue: string;
  "Visible annuaire": string;
  Baptisé: string;
  "Baptisé depuis": string;
  Mpiandry: string;
  "Mpiandry depuis": string;
  Mpandray: string;
  "Mpandray depuis": string;
  "Mpamaky teny": string;
  Branches: string;
  Affectations: string;
};

const YES = "Oui";
const NO = "Non";

function boolLabel(value: boolean): string {
  return value ? YES : NO;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatBranches(
  branches: { branch_code: string; role: string | null }[],
): string {
  if (!branches.length) return "";
  return branches
    .map((b) => {
      const label = getBranchLabel(b.branch_code);
      return b.role ? `${label} (${b.role})` : label;
    })
    .join(", ");
}

export function householdsToExportRows(
  households: Household[],
): HouseholdExportRow[] {
  return households.map((household) => ({
    "ID foyer": household.id,
    Nom: household.name,
    Adresse: household.main_address,
    "Tél. fixe": household.landline_phone ?? "",
    "Arrivée FJKM": formatDate(household.arrival_date_fjkm),
    "Créé le": formatDateTime(household.created_at),
    "MAJ foyer": formatDateTime(household.updated_at),
    Statut: household.unregistered_at ? "Archivé" : "Actif",
    "Désinscrit le": formatDate(household.unregistered_at),
  }));
}

export function membersToExportRows(
  persons: Person[],
  roleLabels: Record<string, string>,
): MemberExportRow[] {
  return persons.map((person) => ({
    "ID membre": person.id,
    "ID foyer": person.household_id,
    Civilité: person.civility ?? "",
    Nom: person.last_name,
    Prénom: person.first_name,
    Rôle: roleLabels[person.role] ?? person.role,
    Enfant: boolLabel(person.is_child),
    Âge: person.age != null ? String(person.age) : "",
    Courriel: person.email ?? "",
    Téléphone: person.phone ?? "",
    Langue: person.preferred_language,
    "Visible annuaire": boolLabel(person.is_visible_in_directory),
    Baptisé: boolLabel(person.is_baptized),
    "Baptisé depuis": formatDate(person.baptized_since),
    Mpiandry: boolLabel(person.is_mpiandry),
    "Mpiandry depuis": formatDate(person.mpiandry_since),
    Mpandray: boolLabel(person.is_mpandray),
    "Mpandray depuis": formatDate(person.mpandray_since),
    "Mpamaky teny": boolLabel(person.is_mpamaky_teny),
    Branches: formatBranches(person.branches ?? []),
    Affectations: person.church_assignments ?? "",
  }));
}

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvBuffer<T extends Record<string, string>>(rows: T[]): Buffer {
  if (rows.length === 0) {
    return Buffer.from("\uFEFF", "utf-8");
  }

  const headers = Object.keys(rows[0]) as (keyof T)[];
  const lines = [
    headers.join(";"),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header] ?? "")).join(";"),
    ),
  ];

  return Buffer.from(`\uFEFF${lines.join("\r\n")}`, "utf-8");
}

export function buildHouseholdsExportXlsxBuffer(
  dataset: HouseholdsExportDataset,
  roleLabels: Record<string, string>,
): Buffer {
  const householdSheet = XLSX.utils.json_to_sheet(
    householdsToExportRows(dataset.households),
  );
  const memberSheet = XLSX.utils.json_to_sheet(
    membersToExportRows(dataset.members, roleLabels),
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, householdSheet, "Foyers");
  XLSX.utils.book_append_sheet(workbook, memberSheet, "Membres");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function buildHouseholdsExportZipBuffer(
  dataset: HouseholdsExportDataset,
  roleLabels: Record<string, string>,
): Promise<Buffer> {
  const zip = new JSZip();
  zip.file(
    "foyers.csv",
    buildCsvBuffer(householdsToExportRows(dataset.households)),
  );
  zip.file(
    "membres.csv",
    buildCsvBuffer(membersToExportRows(dataset.members, roleLabels)),
  );
  return zip.generateAsync({ type: "nodebuffer" });
}

export function buildExportFilename(format: "csv" | "xlsx"): string {
  const date = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    return `foyers-membres-${date}.zip`;
  }
  return `foyers-membres-${date}.xlsx`;
}
