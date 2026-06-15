import type { AnnouncementWithAttachments } from "@/types/database";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AnnouncementsBrowseSearchParams = {
  date?: string | string[];
};

export function parseAnnouncementsBrowseDate(
  searchParams: AnnouncementsBrowseSearchParams,
): string | null {
  const raw = searchParams.date;
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || !ISO_DATE.test(value)) {
    return null;
  }
  return value;
}

export function collectApprovedEventDates(
  announcements: AnnouncementWithAttachments[],
): string[] {
  const dates = new Set<string>();
  for (const announcement of announcements) {
    for (const date of announcement.event_dates) {
      dates.add(date);
    }
  }
  return Array.from(dates).sort();
}

export function filterApprovedAnnouncementsByDate(
  announcements: AnnouncementWithAttachments[],
  date: string | null,
): AnnouncementWithAttachments[] {
  if (!date) {
    return announcements;
  }

  return announcements.filter((announcement) =>
    announcement.event_dates.includes(date),
  );
}

export function defaultBrowseDate(
  availableDates: string[],
  today = new Date(),
): string | null {
  if (availableDates.length === 0) {
    return null;
  }

  const todayIso = today.toISOString().slice(0, 10);
  if (availableDates.includes(todayIso)) {
    return todayIso;
  }

  const upcoming = availableDates.find((date) => date >= todayIso);
  if (upcoming) {
    return upcoming;
  }

  return availableDates[availableDates.length - 1] ?? null;
}
