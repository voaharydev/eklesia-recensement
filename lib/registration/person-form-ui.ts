import type { FieldErrors } from "react-hook-form";

import type {
  ChildFormValues,
  HouseholdPersonsFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";

export type PersonSummaryLabels = {
  notProvided: string;
  ageSummary: (age: string) => string;
};

export function getMemberSummary(
  member: MemberFormValues | undefined,
  labels: PersonSummaryLabels,
): string {
  if (!member) return labels.notProvided;
  const name = [member.first_name, member.last_name].filter(Boolean).join(" ");
  const age = member.age?.trim();
  if (name && age) return `${name} · ${labels.ageSummary(age)}`;
  if (name) return name;
  return labels.notProvided;
}

export function getChildSummary(
  child: ChildFormValues | undefined,
  labels: PersonSummaryLabels,
): string {
  if (!child) return labels.notProvided;
  const name = [child.first_name, child.last_name].filter(Boolean).join(" ");
  const age = child.age?.trim();
  if (name && age) return `${name} · ${labels.ageSummary(age)}`;
  if (name) return name;
  return labels.notProvided;
}

export function isMemberComplete(member: MemberFormValues | undefined): boolean {
  if (!member) return false;
  return Boolean(
    member.first_name?.trim() &&
      member.last_name?.trim() &&
      member.age?.trim() &&
      member.preferred_language?.trim(),
  );
}

export function isChildComplete(child: ChildFormValues | undefined): boolean {
  if (!child) return false;
  return Boolean(
    child.first_name?.trim() &&
      child.last_name?.trim() &&
      child.age?.trim(),
  );
}

function getErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    return (value as { message: string }).message;
  }
  return undefined;
}

/** Messages d'erreur Zod/RHF pour une entrée de tableau (membre ou enfant). */
export function collectFieldErrorMessages(
  fieldErrors: Record<string, unknown> | undefined,
): string[] {
  if (!fieldErrors) return [];
  const messages: string[] = [];
  for (const value of Object.values(fieldErrors)) {
    const msg = getErrorMessage(value);
    if (msg) {
      messages.push(msg);
      continue;
    }
    if (value && typeof value === "object") {
      messages.push(
        ...collectFieldErrorMessages(value as Record<string, unknown>),
      );
    }
  }
  return messages;
}

export function memberHasErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>["members"],
  index: number,
): boolean {
  return (
    collectFieldErrorMessages(
      errors?.[index] as Record<string, unknown> | undefined,
    ).length > 0
  );
}

export function childHasErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>["children"],
  index: number,
): boolean {
  return (
    collectFieldErrorMessages(
      errors?.[index] as Record<string, unknown> | undefined,
    ).length > 0
  );
}

const MEMBER_CHURCH_ERROR_KEYS = [
  "baptized_since",
  "mpiandry_since",
  "mpandray_since",
  "branches",
] as const;

export function memberHasChurchErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>["members"],
  index: number,
): boolean {
  const item = errors?.[index];
  if (!item) return false;
  if (
    collectFieldErrorMessages(
      item.branches as Record<string, unknown> | undefined,
    ).length > 0
  ) {
    return true;
  }
  return MEMBER_CHURCH_ERROR_KEYS.some((key) => {
    if (key === "branches") return false;
    return getErrorMessage(item[key]) !== undefined;
  });
}

export function getMemberErrorMessages(
  errors: FieldErrors<HouseholdPersonsFormValues>["members"],
  index: number,
): string[] {
  return collectFieldErrorMessages(
    errors?.[index] as Record<string, unknown> | undefined,
  );
}

export function getChildErrorMessages(
  errors: FieldErrors<HouseholdPersonsFormValues>["children"],
  index: number,
): string[] {
  return collectFieldErrorMessages(
    errors?.[index] as Record<string, unknown> | undefined,
  );
}

export function findFirstErrorIndex(
  errors: FieldErrors<HouseholdPersonsFormValues>,
): { kind: "adult" | "child"; index: number } | null {
  if (errors.members?.length) {
    for (let i = 0; i < errors.members.length; i++) {
      if (memberHasErrors(errors.members, i)) {
        return { kind: "adult", index: i };
      }
    }
  }
  if (errors.children?.length) {
    for (let i = 0; i < errors.children.length; i++) {
      if (childHasErrors(errors.children, i)) {
        return { kind: "child", index: i };
      }
    }
  }
  return null;
}

export function memberHasChurchData(member: MemberFormValues | undefined): boolean {
  if (!member) return false;
  return Boolean(
    member.is_baptized ||
      member.is_mpiandry ||
      member.is_mpandray ||
      (member.branches?.length ?? 0) > 0 ||
      member.church_assignments?.trim(),
  );
}
