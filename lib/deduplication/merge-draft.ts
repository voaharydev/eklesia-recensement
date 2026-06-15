import { mergePersonBranches } from "@/lib/deduplication/merge-branches";
import type { DuplicatePersonSummary } from "@/lib/deduplication/types";
import {
  emailsForForm,
  mergeEmailLists,
  mergePhoneLists,
  normalizeEmails,
  normalizePhones,
  phonesForForm,
} from "@/lib/contacts/person-contacts";
import type { Json, PersonBranchAssignment } from "@/types/database";

export type MergeProfileDraft = {
  firstName: string;
  lastName: string;
  emails: string[];
  phones: string[];
  role: string;
  age: string;
  branches: PersonBranchAssignment[];
  isBaptized: boolean;
  isMpandray: boolean;
  isMpiandry: boolean;
  isSefala: boolean;
  isMpamakyTeny: boolean;
};

export type MergeDraftScalarField =
  | "firstName"
  | "lastName"
  | "emails"
  | "phones"
  | "role"
  | "age"
  | "isBaptized"
  | "isMpandray"
  | "isMpiandry"
  | "isSefala"
  | "isMpamakyTeny";

export type BranchDraftOption = {
  branchCode: string;
  masterRole: string | null;
  duplicateRole: string | null;
};

function formatAge(age: number | null): string {
  return age == null ? "" : String(age);
}

export function buildDefaultMergeDraft(
  master: DuplicatePersonSummary,
  duplicate: DuplicatePersonSummary,
): MergeProfileDraft {
  return {
    firstName: master.firstName,
    lastName: master.lastName,
    emails: mergeEmailLists(master.emails, duplicate.emails),
    phones: mergePhoneLists(master.phones, duplicate.phones),
    role: master.role,
    age: formatAge(master.age ?? duplicate.age),
    branches: mergePersonBranches(master.branches, duplicate.branches),
    isBaptized: master.isBaptized || duplicate.isBaptized,
    isMpandray: master.isMpandray || duplicate.isMpandray,
    isMpiandry: master.isMpiandry || duplicate.isMpiandry,
    isSefala: master.isSefala || duplicate.isSefala,
    isMpamakyTeny: master.isMpamakyTeny || duplicate.isMpamakyTeny,
  };
}

function branchRole(
  branches: PersonBranchAssignment[],
  branchCode: string,
): string | null {
  return branches.find((b) => b.branch_code === branchCode)?.role ?? null;
}

export function collectBranchOptions(
  master: DuplicatePersonSummary,
  duplicate: DuplicatePersonSummary,
): BranchDraftOption[] {
  const codes = new Set<string>();
  for (const branch of master.branches) {
    codes.add(branch.branch_code);
  }
  for (const branch of duplicate.branches) {
    codes.add(branch.branch_code);
  }

  return Array.from(codes)
    .sort()
    .map((branchCode) => ({
      branchCode,
      masterRole: branchRole(master.branches, branchCode),
      duplicateRole: branchRole(duplicate.branches, branchCode),
    }));
}

export function applySourceField(
  draft: MergeProfileDraft,
  field: MergeDraftScalarField,
  source: "master" | "duplicate",
  master: DuplicatePersonSummary,
  duplicate: DuplicatePersonSummary,
): MergeProfileDraft {
  const person = source === "master" ? master : duplicate;

  switch (field) {
    case "firstName":
      return { ...draft, firstName: person.firstName };
    case "lastName":
      return { ...draft, lastName: person.lastName };
    case "emails":
      return { ...draft, emails: emailsForForm(person) };
    case "phones":
      return { ...draft, phones: phonesForForm(person) };
    case "role":
      return { ...draft, role: person.role };
    case "age":
      return { ...draft, age: formatAge(person.age) };
    case "isBaptized":
      return { ...draft, isBaptized: person.isBaptized };
    case "isMpandray":
      return { ...draft, isMpandray: person.isMpandray };
    case "isMpiandry":
      return { ...draft, isMpiandry: person.isMpiandry };
    case "isSefala":
      return { ...draft, isSefala: person.isSefala };
    case "isMpamakyTeny":
      return { ...draft, isMpamakyTeny: person.isMpamakyTeny };
    default:
      return draft;
  }
}

export function isBranchIncluded(
  draft: MergeProfileDraft,
  branchCode: string,
): boolean {
  return draft.branches.some((b) => b.branch_code === branchCode);
}

export function toggleBranchInDraft(
  draft: MergeProfileDraft,
  option: BranchDraftOption,
  included: boolean,
  roleSource: "master" | "duplicate" | "current",
): MergeProfileDraft {
  const without = draft.branches.filter((b) => b.branch_code !== option.branchCode);

  if (!included) {
    return { ...draft, branches: without };
  }

  const role =
    roleSource === "master"
      ? option.masterRole
      : roleSource === "duplicate"
        ? option.duplicateRole
        : (without.find((b) => b.branch_code === option.branchCode)?.role ??
          option.masterRole ??
          option.duplicateRole);

  return {
    ...draft,
    branches: [...without, { branch_code: option.branchCode, role }].sort(
      (a, b) => a.branch_code.localeCompare(b.branch_code),
    ),
  };
}

export function setBranchRoleFromSource(
  draft: MergeProfileDraft,
  option: BranchDraftOption,
  source: "master" | "duplicate",
): MergeProfileDraft {
  if (!isBranchIncluded(draft, option.branchCode)) {
    return toggleBranchInDraft(draft, option, true, source);
  }

  const role = source === "master" ? option.masterRole : option.duplicateRole;
  return {
    ...draft,
    branches: draft.branches.map((branch) =>
      branch.branch_code === option.branchCode
        ? { ...branch, role }
        : branch,
    ),
  };
}

export function mergeDraftToPatch(draft: MergeProfileDraft): Json {
  return {
    first_name: draft.firstName.trim(),
    last_name: draft.lastName.trim(),
    emails: normalizeEmails(draft.emails),
    phones: normalizePhones(draft.phones),
    role: draft.role,
    age: draft.age.trim() || null,
    branches: draft.branches,
    is_baptized: draft.isBaptized,
    is_mpandray: draft.isMpandray,
    is_mpiandry: draft.isMpiandry,
    is_sefala: draft.isSefala,
    is_mpamaky_teny: draft.isMpamakyTeny,
  };
}
