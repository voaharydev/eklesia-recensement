import type { HouseholdRole } from "@/lib/constants/person-roles";
import { cellToString, normalizeEmail, normalizeHouseholdKey } from "@/lib/import/normalize";
import type { ImportPersonDraft, ImportRowError } from "@/lib/import/types";
import type { PersonBranchAssignment } from "@/types/database";

export const MERGE_SHEET_NAME = "Merge";

/** Indices fixes de l'onglet Merge (Listing mai 2026). */
export const MERGE_COLUMN_INDICES = {
  headEmail: 0,
  headCivility: 1,
  headName: 2,
  mainAddress: 3,
  headPhone: 4,
  landlinePhone: 5,
  arrivalDateFjkm: 6,
  spouseName: 8,
  spousePhone: 9,
  spouseEmail: 10,
  child1Name: 12,
  child1Email: 13,
  child1Phone: 14,
  child2Name: 16,
  child2Email: 17,
  child2Phone: 18,
  child3Name: 20,
  child3Email: 21,
  child3Phone: 22,
  child4Name: 24,
} as const;

export const MERGE_CHILD_BLOCKS = [
  { name: MERGE_COLUMN_INDICES.child1Name, email: MERGE_COLUMN_INDICES.child1Email, phone: MERGE_COLUMN_INDICES.child1Phone },
  { name: MERGE_COLUMN_INDICES.child2Name, email: MERGE_COLUMN_INDICES.child2Email, phone: MERGE_COLUMN_INDICES.child2Phone },
  { name: MERGE_COLUMN_INDICES.child3Name, email: MERGE_COLUMN_INDICES.child3Email, phone: MERGE_COLUMN_INDICES.child3Phone },
  { name: MERGE_COLUMN_INDICES.child4Name, email: undefined, phone: undefined },
] as const;

export const DEFAULT_CHILD_AGE = 10;
const DEFAULT_ADULT_AGE = 30;
const MISSING_ADDRESS_PLACEHOLDER = "À compléter";

export type ParsedFullName = {
  first_name: string;
  last_name: string;
};

/**
 * Dernier mot = nom de famille ; le reste = prénom(s).
 * Un seul mot → nom de famille, prénom « . » (champ requis en base).
 */
export function parseFullName(fullName: string): ParsedFullName {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return { first_name: ".", last_name: "Inconnu" };
  }
  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    return { first_name: ".", last_name: parts[0] };
  }
  return {
    first_name: parts.slice(0, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

function cell(row: unknown[], index: number): string {
  return cellToString(row[index]);
}

function emptyPersonDraftBase(
  excelRowNumber: number,
  householdKey: string,
  householdName: string,
  mainAddress: string,
  landlinePhone: string | null,
  arrivalDateFjkm: string | null,
): Pick<
  ImportPersonDraft,
  | "excelRowNumber"
  | "householdKey"
  | "householdName"
  | "mainAddress"
  | "landlinePhone"
  | "arrivalDateFjkm"
  | "isVisibleInDirectory"
  | "isBaptized"
  | "baptizedSince"
  | "isMpiandry"
  | "mpiandrySince"
  | "isMpandray"
  | "mpandraySince"
  | "isSefala"
  | "sefalaSince"
  | "branches"
  | "churchAssignments"
  | "preferredLanguage"
> {
  return {
    excelRowNumber,
    householdKey,
    householdName,
    mainAddress,
    landlinePhone,
    arrivalDateFjkm,
    preferredLanguage: "mg",
    isVisibleInDirectory: true,
    isBaptized: false,
    baptizedSince: null,
    isMpiandry: false,
    mpiandrySince: null,
    isMpandray: false,
    mpandraySince: null,
    isSefala: false,
    sefalaSince: null,
    branches: [] as PersonBranchAssignment[],
    churchAssignments: null,
  };
}

function buildAdultDraft(
  base: ReturnType<typeof emptyPersonDraftBase>,
  role: HouseholdRole,
  fullName: string,
  civility: string | null,
  email: string | null,
  phone: string | null,
  age: number,
): ImportPersonDraft {
  const { first_name, last_name } = parseFullName(fullName);
  return {
    ...base,
    civility,
    firstName: first_name,
    lastName: last_name,
    role,
    email,
    phone: phone?.trim() || null,
    age,
    isChild: false,
  };
}

function buildChildDraft(
  base: ReturnType<typeof emptyPersonDraftBase>,
  fullName: string,
  email: string | null,
  phone: string | null,
  headLastName: string,
): ImportPersonDraft {
  const parsed = parseFullName(fullName);
  const lastName =
    parsed.last_name && parsed.last_name !== "Inconnu"
      ? parsed.last_name
      : headLastName;
  return {
    ...base,
    civility: null,
    firstName: parsed.first_name,
    lastName: lastName,
    role: "enfant",
    email,
    phone: phone?.trim() || null,
    age: DEFAULT_CHILD_AGE,
    isChild: true,
  };
}

export function isMergeSheetLayout(headerRow: string[]): boolean {
  const h0 = cellToString(headerRow[0]).trim();
  const h8 = cellToString(headerRow[8]).trim();
  return (
    h0 === "Adresse e-mail" &&
    (h8 === "Anaran'ny vady" || h8.includes("vady"))
  );
}

export type MergeRowExpandResult = {
  drafts: ImportPersonDraft[];
  error: ImportRowError | null;
};

export function expandMergeRowToDrafts(
  row: unknown[],
  excelRowNumber: number,
): MergeRowExpandResult {
  const headEmailRaw = cell(row, MERGE_COLUMN_INDICES.headEmail);
  const headNameRaw = cell(row, MERGE_COLUMN_INDICES.headName);
  const headEmail = normalizeEmail(headEmailRaw);
  const mainAddressRaw = cell(row, MERGE_COLUMN_INDICES.mainAddress).trim();

  if (!headEmail && !headNameRaw.trim()) {
    return {
      drafts: [],
      error: {
        excelRowNumber,
        message: "Courriel ou Anarana du chef requis.",
      },
    };
  }

  const headParsed = parseFullName(headNameRaw || headEmailRaw.split("@")[0] || "Inconnu");
  const householdName = `Famille ${headParsed.last_name}`;
  const mainAddress = mainAddressRaw || MISSING_ADDRESS_PLACEHOLDER;
  const householdKey = headEmail
    ? `email:${headEmail}`
    : normalizeHouseholdKey(householdName, mainAddress);

  const base = emptyPersonDraftBase(
    excelRowNumber,
    householdKey,
    householdName,
    mainAddress,
    cell(row, MERGE_COLUMN_INDICES.landlinePhone).trim() || null,
    cell(row, MERGE_COLUMN_INDICES.arrivalDateFjkm).trim() || null,
  );

  const drafts: ImportPersonDraft[] = [];

  drafts.push(
    buildAdultDraft(
      base,
      "chef_de_famille",
      headNameRaw || headEmailRaw.split("@")[0] || "Inconnu",
      cell(row, MERGE_COLUMN_INDICES.headCivility).trim() || null,
      headEmail,
      cell(row, MERGE_COLUMN_INDICES.headPhone),
      DEFAULT_ADULT_AGE,
    ),
  );

  const spouseName = cell(row, MERGE_COLUMN_INDICES.spouseName).trim();
  if (spouseName) {
    drafts.push(
      buildAdultDraft(
        base,
        "conjoint",
        spouseName,
        null,
        normalizeEmail(cell(row, MERGE_COLUMN_INDICES.spouseEmail)),
        cell(row, MERGE_COLUMN_INDICES.spousePhone),
        DEFAULT_ADULT_AGE,
      ),
    );
  }

  for (const block of MERGE_CHILD_BLOCKS) {
    const childName = cell(row, block.name).trim();
    if (!childName) continue;
    drafts.push(
      buildChildDraft(
        base,
        childName,
        block.email != null ? normalizeEmail(cell(row, block.email)) : null,
        block.phone != null ? cell(row, block.phone) : null,
        headParsed.last_name,
      ),
    );
  }

  return { drafts, error: null };
}

export function mergeColumnMappingForInspect(): { index: number; label: string; usage: string }[] {
  return [
    { index: 0, label: "Adresse e-mail", usage: "Courriel chef" },
    { index: 1, label: "Civilité", usage: "Chef" },
    { index: 2, label: "Anarana", usage: "Nom complet chef" },
    { index: 3, label: "Adresse", usage: "Adresse foyer" },
    { index: 4, label: "Tel. Cellulaire", usage: "Mobile chef" },
    { index: 5, label: "Tel. fixe", usage: "Téléphone fixe" },
    { index: 6, label: "Daty FJKM", usage: "Arrivée FJKM" },
    { index: 8, label: "Anaran'ny vady", usage: "Nom conjoint" },
    { index: 9, label: "Tel. Cellulaire", usage: "Mobile conjoint" },
    { index: 10, label: "e-mail", usage: "Courriel conjoint" },
    { index: 12, label: "Zanaka 1", usage: "Enfant 1 (nom, email, tel)" },
    { index: 16, label: "Zanaka 2", usage: "Enfant 2" },
    { index: 20, label: "Zanaka 3", usage: "Enfant 3" },
    { index: 24, label: "Zanaka 4", usage: "Enfant 4 (nom)" },
  ];
}
