import { getTranslations } from "next-intl/server";

import { getPendingAnnouncements } from "@/app/actions/announcements";
import { AnnouncementsAdminTabs } from "@/components/admin/announcements-admin-tabs";
import { AnnouncementsPendingList } from "@/components/admin/announcements-pending-list";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.announcements" });

  const result = await getPendingAnnouncements();

  const labels = {
    title: t("title"),
    description: t("description"),
    pendingTab: t("pendingTab"),
    publishedTab: t("publishedTab"),
    empty: t("empty"),
    branch: t("branch"),
    verse: t("verse"),
    subject: t("subject"),
    eventDates: t("eventDates"),
    location: t("location"),
    body: t("body"),
    submittedAt: t("submittedAt"),
    approve: t("approve"),
    reject: t("reject"),
    approving: t("approving"),
    rejecting: t("rejecting"),
    actionError: t("actionError"),
    attachments: t("attachments"),
    downloadAttachment: t("downloadAttachment"),
    downloadingAttachment: t("downloadingAttachment"),
    downloadAttachmentError: t("downloadAttachmentError"),
    noAttachments: t("noAttachments"),
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{labels.title}</h1>
        <p className="text-sm text-muted">{labels.description}</p>
      </header>

      <AnnouncementsAdminTabs
        labels={{ pending: labels.pendingTab, published: labels.publishedTab }}
      />

      {result.error ? (
        <Alert variant="error">{result.error}</Alert>
      ) : (
        <AnnouncementsPendingList announcements={result.data ?? []} labels={labels} />
      )}
    </div>
  );
}
