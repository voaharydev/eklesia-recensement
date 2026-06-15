import { findPresetCodeByStoredRole } from "@/lib/constants/branch-roles";
import { resolveBranchCode } from "@/lib/constants/branches";
import type { CommunicationFilters, TargetedMember } from "@/types/communication";
import type { Person, PersonBranchAssignment } from "@/types/database";

export type CommunicationPersonRow = Pick<
  Person,
  "id" | "first_name" | "last_name" | "emails" | "phones" | "branches"
> & {
  household: { name: string };
};

function personMatchesBranchRole(
  branches: PersonBranchAssignment[],
  branchRole: string,
  branchFilter?: string,
): boolean {
  return branches.some((assignment) => {
    if (branchFilter && assignment.branch_code !== branchFilter) {
      return false;
    }

    const resolvedBranch = resolveBranchCode(assignment.branch_code);
    if (!resolvedBranch) return false;

    const presetCode = findPresetCodeByStoredRole(
      resolvedBranch,
      assignment.role,
    );
    return presetCode === branchRole;
  });
}

export function applyCommunicationPostFilters(
  rows: CommunicationPersonRow[],
  filters: Pick<CommunicationFilters, "branchRole" | "channel">,
): CommunicationPersonRow[] {
  let result = rows;

  if (filters.branchRole) {
    result = result.filter((person) =>
      personMatchesBranchRole(
        person.branches ?? [],
        filters.branchRole!,
        undefined,
      ),
    );
  }

  if (filters.channel === "sms") {
    result = result.filter((person) => person.phones.length > 0);
  } else {
    result = result.filter((person) => person.emails.length > 0);
  }

  return result;
}

export function mapToTargetedMembers(
  rows: CommunicationPersonRow[],
): TargetedMember[] {
  return rows
    .map((person) => ({
      id: person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      emails: person.emails,
      phones: person.phones,
      householdName: person.household.name,
    }))
    .sort((a, b) => {
      const last = a.lastName.localeCompare(b.lastName, "fr");
      if (last !== 0) return last;
      return a.firstName.localeCompare(b.firstName, "fr");
    });
}

export function collectEmailsForCopy(members: TargetedMember[]): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];

  for (const member of members) {
    for (const email of member.emails) {
      const normalized = email.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      emails.push(normalized);
    }
  }

  return emails;
}

export function collectPhonesForCopy(members: TargetedMember[]): string[] {
  const seen = new Set<string>();
  const phones: string[] = [];

  for (const member of members) {
    for (const phone of member.phones) {
      const trimmed = phone.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      phones.push(trimmed);
    }
  }

  return phones;
}
