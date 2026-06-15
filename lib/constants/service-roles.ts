import type { ServiceRoleCode } from "@/types/database";

export const SERVICE_ROLE_CODES = [
  "powerpoint",
  "priere",
  "lecture_1",
  "lecture_2",
  "lecture_3",
] as const satisfies readonly ServiceRoleCode[];

/** Rôles assignés exclusivement aux mpamaky teny (`is_mpamaky_teny`). */
export const MPAMAKY_TENY_ROLE_CODES = [
  "priere",
  "lecture_1",
  "lecture_2",
  "lecture_3",
] as const satisfies readonly ServiceRoleCode[];

export type ServiceRoleLabelKey =
  | "powerpoint"
  | "priere"
  | "lecture1"
  | "lecture2"
  | "lecture3";

const ROLE_LABEL_KEYS: Record<ServiceRoleCode, ServiceRoleLabelKey> = {
  powerpoint: "powerpoint",
  priere: "priere",
  lecture_1: "lecture1",
  lecture_2: "lecture2",
  lecture_3: "lecture3",
};

export function getServiceRoleLabelKey(
  code: ServiceRoleCode,
): ServiceRoleLabelKey {
  return ROLE_LABEL_KEYS[code];
}

export function isMpamakyRole(code: ServiceRoleCode): boolean {
  return (MPAMAKY_TENY_ROLE_CODES as readonly ServiceRoleCode[]).includes(code);
}
