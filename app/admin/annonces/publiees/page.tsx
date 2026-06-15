import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { getApprovedAnnouncements } from "@/app/actions/announcements";
import { AnnouncementsAdminTabs } from "@/components/admin/announcements-admin-tabs";
import { AnnouncementsDateFilter } from "@/components/admin/announcements-date-filter";
import { ApprovedAnnouncementsList } from "@/components/admin/approved-announcements-list";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import {
  collectApprovedEventDates,
  defaultBrowseDate,
  filterApprovedAnnouncementsByDate,
  parseAnnouncementsBrowseDate,
  type AnnouncementsBrowseSearchParams,
} from "@/lib/announcements/browse-by-date";
import { formatDateShort } from "@/lib/format/datetime";

export const dynamic = "force-dynamic";

type AdminPublishedAnnouncementsPageProps = {
  searchParams: AnnouncementsBrowseSearchParams;
};

export default async function AdminPublishedAnnouncementsPage({
  searchParams,
}: AdminPublishedAnnouncementsPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.announcements" });
  const tp = await getTranslations({ locale: "fr", namespace: "admin.announcements.published" });

  const result = await getApprovedAnnouncements();

  const parsedDate = parseAnnouncementsBrowseDate(searchParams);
  const allApproved = result.data ?? [];
  const availableDates = collectApprovedEventDates(allApproved);
  const selectedDate =
    parsedDate ?? (searchParams.date === undefined ? defaultBrowseDate(availableDates) : null);
  const filtered = filterApprovedAnnouncementsByDate(allApproved, selectedDate);

  const tabLabels = {
    pending: t("pendingTab"),
    published: t("publishedTab"),
  };

  const filterLabels = {
    dateLabel: tp("dateLabel"),
    allDates: tp("allDates"),
    submit: tp("filterSubmit"),
  };

  const listLabels = {
    empty: tp("empty"),
    emptyForDate: selectedDate
      ? tp("emptyForDate", { date: formatDateShort(selectedDate) })
      : tp("empty"),
    body: t("body"),
    verse: t("verse"),
    eventDates: t("eventDates"),
    location: t("location"),
    attachments: t("attachments"),
    downloadAttachment: t("downloadAttachment"),
    downloadingAttachment: t("downloadingAttachment"),
    downloadAttachmentError: t("downloadAttachmentError"),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted">{tp("description")}</p>
      </header>

      <AnnouncementsAdminTabs labels={tabLabels} />

      {result.error ? (
        <Alert variant="error">{result.error}</Alert>
      ) : (
        <>
          <Suspense fallback={null}>
            <AnnouncementsDateFilter
              basePath="/admin/annonces/publiees"
              selectedDate={selectedDate}
              availableDates={availableDates}
              labels={filterLabels}
            />
          </Suspense>

          {selectedDate ? (
            <p className="text-sm text-muted">
              {tp("resultCount", {
                count: filtered.length,
                date: formatDateShort(selectedDate),
              })}
            </p>
          ) : null}

          <ApprovedAnnouncementsList
            announcements={filtered}
            selectedDate={selectedDate}
            labels={listLabels}
          />
        </>
      )}
    </div>
  );
}
