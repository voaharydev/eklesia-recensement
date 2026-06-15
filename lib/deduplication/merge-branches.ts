import type { PersonBranchAssignment } from "@/types/database";

export function mergePersonBranches(
  masterBranches: PersonBranchAssignment[],
  duplicateBranches: PersonBranchAssignment[],
): PersonBranchAssignment[] {
  const byCode = new Map<string, PersonBranchAssignment>();

  for (const branch of masterBranches) {
    byCode.set(branch.branch_code, branch);
  }

  for (const branch of duplicateBranches) {
    if (!byCode.has(branch.branch_code)) {
      byCode.set(branch.branch_code, branch);
    }
  }

  return Array.from(byCode.values()).sort((a, b) =>
    a.branch_code.localeCompare(b.branch_code),
  );
}
