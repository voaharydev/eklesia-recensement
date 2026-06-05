import type { BranchCode } from "@/lib/constants/branches";
import {
  BRANCH_OPTIONS,
  legacyBranchTextToCode,
  resolveBranchCode,
} from "@/lib/constants/branches";
import type { HouseholdRole } from "@/lib/constants/person-roles";
import { MAX_CHILD_AGE, MIN_ADULT_AGE } from "@/lib/constants/ages";
import type { PersonBranchAssignment } from "@/types/database";

export function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") {
    if (Number.isInteger(value) && value > 40000 && value < 60000) {
      return "";
    }
    return String(value);
  }
  return String(value).trim();
}

export function parseBoolean(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (["oui", "yes", "y", "true", "1", "x", "vrai"].includes(v)) return true;
  if (["non", "no", "n", "false", "0", "faux"].includes(v)) return false;
  return Boolean(v);
}

/** Excel serial date or text → YYYY-MM-DD or null. */
export function parseDate(value: string, excelSerial?: number): string | null {
  if (excelSerial != null && excelSerial > 0) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(epoch.getTime() + excelSerial * 86400000);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^\d{4}-\d{2}-\d{2}/.exec(trimmed);
  if (iso) return iso[0];

  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(trimmed);
  if (fr) {
    const day = fr[1].padStart(2, "0");
    const month = fr[2].padStart(2, "0");
    let year = fr[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString().slice(0, 10);
  }

  return null;
}

export function parseAge(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

const ROLE_MAP: Record<string, HouseholdRole> = {
  chef: "chef_de_famille",
  chef_de_famille: "chef_de_famille",
  "chef de famille": "chef_de_famille",
  head: "chef_de_famille",
  conjoint: "conjoint",
  conjointe: "conjoint",
  epoux: "conjoint",
  epouse: "conjoint",
  spouse: "conjoint",
  vady: "conjoint",
  enfant: "enfant",
  child: "enfant",
  fils: "enfant",
  fille: "enfant",
  autre: "autre",
  other: "autre",
  parent: "autre",
  ami: "autre",
};

export function normalizeRole(value: string): HouseholdRole | null {
  const key = normalizeHeader(value);
  if (!key) return null;
  return ROLE_MAP[key] ?? null;
}

export function inferRoleFromAge(age: number): HouseholdRole {
  return age <= MAX_CHILD_AGE ? "enfant" : "autre";
}

export function resolveAgeAndChild(
  role: HouseholdRole,
  age: number | null,
): { age: number; isChild: boolean; role: HouseholdRole } {
  let resolvedRole = role;
  let resolvedAge = age;

  if (resolvedAge == null) {
    if (resolvedRole === "enfant") {
      resolvedAge = MAX_CHILD_AGE;
    } else {
      resolvedAge = MIN_ADULT_AGE;
    }
  }

  let isChild = resolvedRole === "enfant";
  if (!isChild && resolvedAge <= MAX_CHILD_AGE) {
    isChild = true;
    if (resolvedRole === "chef_de_famille" || resolvedRole === "conjoint") {
      resolvedRole = "enfant";
    }
  }
  if (isChild && resolvedAge > MAX_CHILD_AGE) {
    resolvedAge = MAX_CHILD_AGE;
  }
  if (!isChild && resolvedAge < MIN_ADULT_AGE) {
    resolvedAge = MIN_ADULT_AGE;
  }

  return { age: resolvedAge, isChild, role: resolvedRole };
}

export function parseBranchesField(value: string): PersonBranchAssignment[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/[,;|/]+/).map((p) => p.trim()).filter(Boolean);
  const result: PersonBranchAssignment[] = [];
  const seen = new Set<BranchCode>();

  for (const part of parts) {
    const colon = part.indexOf(":");
    const label = colon >= 0 ? part.slice(0, colon).trim() : part;
    const roleText = colon >= 0 ? part.slice(colon + 1).trim() : "";

    const code =
      resolveBranchCode(label) ??
      legacyBranchTextToCode(label) ??
      BRANCH_OPTIONS.find(
        (b) => normalizeHeader(b.label) === normalizeHeader(label),
      )?.code ??
      null;

    if (!code || seen.has(code)) continue;
    seen.add(code);
    result.push({
      branch_code: code,
      role: roleText || null,
    });
  }

  return result;
}

export function normalizeHouseholdKey(name: string, address: string): string {
  const n = normalizeHeader(name);
  const a = normalizeHeader(address);
  return `${n}::${a}`;
}

export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  return trimmed && trimmed.includes("@") ? trimmed : null;
}

export function normalizePreferredLanguage(value: string): string {
  const v = value.trim().toLowerCase();
  if (v === "mg" || v.startsWith("malag")) return "mg";
  return "fr";
}
