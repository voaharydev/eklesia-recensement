import {
  BRANCH_CODES,
  resolveBranchCode,
  type BranchCode,
} from "@/lib/constants/branches";

export type BranchRoleCode =
  | "powerpoint"
  | "sonorisation"
  | "responsable"
  | "membre_actif";

export type BranchRoleOption = {
  code: BranchRoleCode;
};

export const BRANCH_ROLE_OTHER = "__other__" as const;

/** Libellés canoniques stockés en base (français). */
export const BRANCH_ROLE_CANONICAL_LABELS: Record<BranchRoleCode, string> = {
  powerpoint: "PowerPoint",
  sonorisation: "Sonorisation",
  responsable: "Responsable",
  membre_actif: "Membre actif",
};

const GENERIC_BRANCH_ROLES: BranchRoleOption[] = [
  { code: "responsable" },
  { code: "membre_actif" },
];

const VAOMIERA_TECHNIKA_ROLES: BranchRoleOption[] = [
  { code: "powerpoint" },
  { code: "sonorisation" },
  { code: "responsable" },
];

export const BRANCH_ROLE_OPTIONS: Record<BranchCode, BranchRoleOption[]> =
  Object.fromEntries(
    BRANCH_CODES.map((code) => [
      code,
      code === "vaomiera_technika"
        ? VAOMIERA_TECHNIKA_ROLES
        : GENERIC_BRANCH_ROLES,
    ]),
  ) as Record<BranchCode, BranchRoleOption[]>;

export type BranchRoleFormMode = "preset" | "other";

export type BranchRoleFormValues = {
  role_mode: BranchRoleFormMode;
  role_preset: string;
  role_custom: string;
};

function normalizeRoleText(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getBranchRoleOptions(branchCode: BranchCode): BranchRoleOption[] {
  return BRANCH_ROLE_OPTIONS[branchCode] ?? GENERIC_BRANCH_ROLES;
}

export function getDefaultBranchRoleForm(
  branchCode: BranchCode,
): BranchRoleFormValues {
  const first = getBranchRoleOptions(branchCode)[0];
  return {
    role_mode: "preset",
    role_preset: first?.code ?? "",
    role_custom: "",
  };
}

export function isValidPresetForBranch(
  branchCode: BranchCode,
  presetCode: string,
): presetCode is BranchRoleCode {
  return getBranchRoleOptions(branchCode).some(
    (option) => option.code === presetCode,
  );
}

export function getCanonicalRoleLabel(
  presetCode: BranchRoleCode,
): string {
  return BRANCH_ROLE_CANONICAL_LABELS[presetCode];
}

export function findPresetCodeByStoredRole(
  branchCode: BranchCode,
  storedRole: string | null | undefined,
): BranchRoleCode | null {
  if (!storedRole?.trim()) return null;

  const normalizedStored = normalizeRoleText(storedRole);
  for (const option of getBranchRoleOptions(branchCode)) {
    const canonical = getCanonicalRoleLabel(option.code);
    if (normalizeRoleText(canonical) === normalizedStored) {
      return option.code;
    }
    if (normalizeRoleText(option.code) === normalizedStored) {
      return option.code;
    }
  }

  return null;
}

export function matchRoleToForm(
  branchCode: BranchCode,
  storedRole: string | null | undefined,
): BranchRoleFormValues {
  const presetCode = findPresetCodeByStoredRole(branchCode, storedRole);
  if (presetCode) {
    return {
      role_mode: "preset",
      role_preset: presetCode,
      role_custom: "",
    };
  }

  if (!storedRole?.trim()) {
    return getDefaultBranchRoleForm(branchCode);
  }

  return {
    role_mode: "other",
    role_preset: getBranchRoleOptions(branchCode)[0]?.code ?? "",
    role_custom: storedRole.trim(),
  };
}

export function resolveRoleForDb(
  branchCode: BranchCode,
  form: BranchRoleFormValues,
): string {
  if (form.role_mode === "other") {
    return form.role_custom.trim();
  }

  if (isValidPresetForBranch(branchCode, form.role_preset)) {
    return getCanonicalRoleLabel(form.role_preset);
  }

  return form.role_preset.trim();
}

export function isPowerPointBranchRole(
  branchCode: string,
  storedRole: string | null | undefined,
): boolean {
  const resolved = resolveBranchCode(branchCode);
  if (resolved !== "vaomiera_technika" || !storedRole?.trim()) {
    return false;
  }

  const presetCode = findPresetCodeByStoredRole(resolved, storedRole);
  if (presetCode === "powerpoint") return true;

  return normalizeRoleText(storedRole).includes("powerpoint");
}
