import { getBranchLabel, resolveBranchCode } from "@/lib/constants/branches";
import {
  BRANCH_ROLE_CANONICAL_LABELS,
  findPresetCodeByStoredRole,
  type BranchRoleCode,
} from "@/lib/constants/branch-roles";

type RoleLabelLookup = (code: BranchRoleCode) => string;

const DEFAULT_FR_LABELS: RoleLabelLookup = (code) =>
  BRANCH_ROLE_CANONICAL_LABELS[code];

export function formatBranchRoleDisplay(
  branchCode: string,
  role: string | null | undefined,
  getRoleLabel: RoleLabelLookup = DEFAULT_FR_LABELS,
): string {
  if (!role?.trim()) return "";

  const resolvedBranch = resolveBranchCode(branchCode);
  if (!resolvedBranch) return role.trim();

  const presetCode = findPresetCodeByStoredRole(resolvedBranch, role);
  if (presetCode) {
    return getRoleLabel(presetCode);
  }

  return role.trim();
}

export function formatBranchAssignmentDisplay(
  branchCode: string,
  role: string | null | undefined,
  getRoleLabel: RoleLabelLookup = DEFAULT_FR_LABELS,
): string {
  const branchLabel = getBranchLabel(branchCode);
  const roleLabel = formatBranchRoleDisplay(branchCode, role, getRoleLabel);
  return roleLabel ? `${branchLabel} (${roleLabel})` : branchLabel;
}
