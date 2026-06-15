"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateAnnouncementStatus } from "@/app/actions/announcements";
import { AnnouncementAttachmentDownload } from "@/components/admin/announcement-attachment-download";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getBranchLabel } from "@/lib/constants/branches";
import { formatDateShort, formatDateTimeShort } from "@/lib/format/datetime";
import type { AnnouncementWithAttachments } from "@/types/database";

type AnnouncementsPendingListLabels = {
  title: string;
  description: string;
  empty: string;
  branch: string;
  verse: string;
  subject: string;
  eventDates: string;
  location: string;
  body: string;
  submittedAt: string;
  approve: string;
  reject: string;
  approving: string;
  rejecting: string;
  actionError: string;
  attachments: string;
  downloadAttachment: string;
  downloadingAttachment: string;
  downloadAttachmentError: string;
  noAttachments: string;
};

type AnnouncementsPendingListProps = {
  announcements: AnnouncementWithAttachments[];
  labels: AnnouncementsPendingListLabels;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function formatEventDates(dates: string[]): string {
  if (dates.length === 0) return "—";
  return dates.map((date) => formatDateShort(date)).join(", ");
}

export function AnnouncementsPendingList({
  announcements,
  labels,
}: AnnouncementsPendingListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleStatusUpdate(id: string, status: "approved" | "rejected") {
    setError(null);
    setPendingId(id);
    setPendingAction(status);

    startTransition(async () => {
      const result = await updateAnnouncementStatus({ id, status });

      setPendingId(null);
      setPendingAction(null);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  if (announcements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-sm text-muted">{labels.empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}

      {announcements.map((announcement) => {
        const isThisPending = isPending && pendingId === announcement.id;
        const isApproving = isThisPending && pendingAction === "approved";
        const isRejecting = isThisPending && pendingAction === "rejected";

        return (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {announcement.subject}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {labels.submittedAt}:{" "}
                    {formatDateTimeShort(announcement.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleStatusUpdate(announcement.id, "approved")}
                  >
                    {isApproving ? labels.approving : labels.approve}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleStatusUpdate(announcement.id, "rejected")}
                  >
                    {isRejecting ? labels.rejecting : labels.reject}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3">
                <MetaRow
                  label={labels.branch}
                  value={getBranchLabel(announcement.branch_code)}
                />
                {announcement.verse ? (
                  <MetaRow label={labels.verse} value={announcement.verse} />
                ) : null}
                {announcement.event_dates.length > 0 ? (
                  <MetaRow
                    label={labels.eventDates}
                    value={formatEventDates(announcement.event_dates)}
                  />
                ) : null}
                {announcement.location ? (
                  <MetaRow label={labels.location} value={announcement.location} />
                ) : null}
                <MetaRow label={labels.body} value={announcement.body} />
                <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm font-medium text-muted">{labels.attachments}</dt>
                  <dd className="flex flex-col gap-3">
                    {announcement.attachments.length === 0 ? (
                      <span className="text-sm text-muted">{labels.noAttachments}</span>
                    ) : (
                      announcement.attachments.map((attachment) => (
                        <AnnouncementAttachmentDownload
                          key={attachment.id}
                          attachmentId={attachment.id}
                          fileName={attachment.file_name}
                          labels={{
                            download: labels.downloadAttachment,
                            downloading: labels.downloadingAttachment,
                            error: labels.downloadAttachmentError,
                          }}
                        />
                      ))
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
