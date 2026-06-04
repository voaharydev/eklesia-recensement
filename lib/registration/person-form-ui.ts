import type { FieldErrors } from "react-hook-form";

import type {
  ChildFormValues,
  HouseholdPersonsFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";

export type AdultFieldPrefix = "head" | "spouse";
export type OtherAdultFieldPrefix = `otherAdults.${number}`;
export type MemberFieldPrefix = AdultFieldPrefix | OtherAdultFieldPrefix;

export function getMemberFieldErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>,
  prefix: MemberFieldPrefix,
): FieldErrors<MemberFormValues> | undefined {
  const match = /^otherAdults\.(\d+)$/.exec(prefix);
  if (match) {
    const index = Number(match[1]);
    return errors.otherAdults?.[index] as FieldErrors<MemberFormValues> | undefined;
  }
  return errors[prefix as AdultFieldPrefix] as
    | FieldErrors<MemberFormValues>
    | undefined;
}

type MemberSummaryInput = {
  first_name?: string;
  last_name?: string;
  age?: string;
};

export function getMemberSummary(
  member: MemberSummaryInput | undefined,
  labels: { notProvided: string; ageSummary: (age: string) => string },
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
  labels: { notProvided: string; ageSummary: (age: string) => string },
): string {
  if (!child) return labels.notProvided;
  const name = [child.first_name, child.last_name].filter(Boolean).join(" ");
  const age = child.age?.trim();
  if (name && age) return `${name} · ${labels.ageSummary(age)}`;
  if (name) return name;
  return labels.notProvided;
}

export function isMemberComplete(
  member: MemberSummaryInput & {
    preferred_language?: string;
  } | undefined,
): boolean {
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

export function adultHasErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>,
  prefix: MemberFieldPrefix,
): boolean {
  return collectFieldErrorMessages(getMemberFieldErrors(errors, prefix)).length > 0;
}

export function otherAdultHasErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>["otherAdults"],
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

export function adultHasChurchErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>,
  prefix: MemberFieldPrefix,
): boolean {
  const item = getMemberFieldErrors(errors, prefix);
  if (!item || typeof item !== "object") return false;
  const record = item;
  if (
    collectFieldErrorMessages(
      record.branches as Record<string, unknown> | undefined,
    ).length > 0
  ) {
    return true;
  }
  return MEMBER_CHURCH_ERROR_KEYS.some((key) => {
    if (key === "branches") return false;
    return getErrorMessage(record[key]) !== undefined;
  });
}

export function getAdultErrorMessages(
  errors: FieldErrors<HouseholdPersonsFormValues>,
  prefix: MemberFieldPrefix,
): string[] {
  return collectFieldErrorMessages(getMemberFieldErrors(errors, prefix));
}

export function otherAdultHasChurchErrors(
  errors: FieldErrors<HouseholdPersonsFormValues>,
  index: number,
): boolean {
  return adultHasChurchErrors(errors, `otherAdults.${index}`);
}

export function getOtherAdultErrorMessages(
  errors: FieldErrors<HouseholdPersonsFormValues>["otherAdults"],
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
  hasSpouse: boolean,
  otherAdultCount: number,
): {
  kind: "head" | "spouse" | "otherAdult" | "child";
  index?: number;
} | null {
  if (adultHasErrors(errors, "head")) {
    return { kind: "head" };
  }
  if (hasSpouse && adultHasErrors(errors, "spouse")) {
    return { kind: "spouse" };
  }
  for (let i = 0; i < otherAdultCount; i++) {
    if (otherAdultHasErrors(errors.otherAdults, i)) {
      return { kind: "otherAdult", index: i };
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

export function adultHasChurchData(
  member:
    | (MemberSummaryInput & {
        is_baptized?: boolean;
        is_mpiandry?: boolean;
        is_mpandray?: boolean;
        branches?: { branch_code: string }[];
        church_assignments?: string;
      })
    | undefined,
): boolean {
  if (!member) return false;
  return Boolean(
    member.is_baptized ||
      member.is_mpiandry ||
      member.is_mpandray ||
      (member.branches?.length ?? 0) > 0 ||
      member.church_assignments?.trim(),
  );
}

