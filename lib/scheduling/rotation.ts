import type { ServiceRoleCode } from "@/types/database";

import { MPAMAKY_TENY_ROLE_CODES } from "@/lib/constants/service-roles";

export type WeekAssignmentSlot = {
  roleCode: ServiceRoleCode;
  personIndex: number;
};

export const MAX_DATE_RANGE_DAYS = 366;

export function enumerateDatesInRange(
  fromDate: string,
  toDate: string,
): string[] {
  if (fromDate > toDate) {
    throw new Error("La date de début doit être antérieure ou égale à la date de fin.");
  }

  const dates: string[] = [];
  const cursor = new Date(`${fromDate}T00:00:00.000Z`);
  const end = new Date(`${toDate}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  if (dates.length > MAX_DATE_RANGE_DAYS) {
    throw new Error(
      `La période ne peut pas dépasser ${MAX_DATE_RANGE_DAYS} jours.`,
    );
  }

  return dates;
}

export function getRotationWeekIndex(serviceDate: string): number {
  const year = Number.parseInt(serviceDate.slice(0, 4), 10);
  const sundayIndex = getSundaysOfYear(year).indexOf(serviceDate);

  if (sundayIndex >= 0) {
    return sundayIndex;
  }

  const start = new Date(Date.UTC(year, 0, 1));
  const date = new Date(`${serviceDate}T00:00:00.000Z`);
  const dayOfYear = Math.floor(
    (date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );

  return Math.floor(dayOfYear / 7);
}

/** @deprecated Préférer getRotationWeekIndex */
export function getWeekNumberForSunday(serviceDate: string): number {
  const year = Number.parseInt(serviceDate.slice(0, 4), 10);
  const weekNumber = getSundaysOfYear(year).indexOf(serviceDate);

  if (weekNumber < 0) {
    throw new Error(`Date invalide pour un culte du dimanche : ${serviceDate}`);
  }

  return weekNumber;
}

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

  for (let i = 0; i < MPAMAKY_TENY_ROLE_CODES.length; i += 1) {
    slots.push({
      roleCode: MPAMAKY_TENY_ROLE_CODES[i],
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
