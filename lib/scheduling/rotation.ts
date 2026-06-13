import type { ServiceRoleCode } from "@/types/database";

const MPAMAKY_ROLES: ServiceRoleCode[] = [
  "priere",
  "lecture_1",
  "lecture_2",
  "lecture_3",
];

export type WeekAssignmentSlot = {
  roleCode: ServiceRoleCode;
  personIndex: number;
};

export function getSundaysOfYear(year: number): string[] {
  const sundays: string[] = [];
  const date = new Date(Date.UTC(year, 0, 1));

  while (date.getUTCDay() !== 0) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  while (date.getUTCFullYear() === year) {
    sundays.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 7);
  }

  return sundays;
}

export function pickFromPool<T>(pool: T[], index: number): T {
  return pool[index % pool.length];
}

export function buildWeekAssignments(
  weekNumber: number,
  powerpointPoolLength: number,
  mpamakyPoolLength: number,
): WeekAssignmentSlot[] {
  const powerpointIndex = weekNumber % powerpointPoolLength;
  const startIndex = (weekNumber * 4) % mpamakyPoolLength;

  const slots: WeekAssignmentSlot[] = [
    { roleCode: "powerpoint", personIndex: powerpointIndex },
  ];

  for (let i = 0; i < MPAMAKY_ROLES.length; i += 1) {
    slots.push({
      roleCode: MPAMAKY_ROLES[i],
      personIndex: (startIndex + i) % mpamakyPoolLength,
    });
  }

  return slots;
}

export function resolvePersonIdForSlot<T extends { id: string }>(
  pool: T[],
  personIndex: number,
): string {
  return pickFromPool(pool, personIndex).id;
}
