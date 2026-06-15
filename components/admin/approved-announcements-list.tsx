import { AnnouncementAttachmentDownload } from "@/components/admin/announcement-attachment-download";
import { getBranchLabel } from "@/lib/constants/branches";
import { formatDateShort } from "@/lib/format/datetime";
import type { AnnouncementWithAttachments } from "@/types/database";

type ApprovedAnnouncementsListProps = {
  announcements: AnnouncementWithAttachments[];
  selectedDate: string | null;
  labels: {
    empty: string;
    emptyForDate: string;
    body: string;
    verse: string;
    eventDates: string;
    location: string;
    attachments: string;
    downloadAttachment: string;
    downloadingAttachment: string;
    downloadAttachmentError: string;
  };
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
      <dt className="text-sm font-medium text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function ApprovedAnnouncementsList({
  announcements,
  selectedDate,
  labels,
}: ApprovedAnnouncementsListProps) {
  if (announcements.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
        {selectedDate ? labels.emptyForDate : labels.empty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          className="rounded-lg border border-border bg-surface p-5 shadow-sm"
        >
          <header className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">{announcement.subject}</h2>
            <p className="text-sm text-muted">{getBranchLabel(announcement.branch_code)}</p>
          </header>

          <dl className="flex flex-col gap-3">
            {announcement.verse ? (
              <MetaRow label={labels.verse} value={announcement.verse} />
            ) : null}
            {announcement.event_dates.length > 0 ? (
              <MetaRow
                label={labels.eventDates}
                value={announcement.event_dates.map((date) => formatDateShort(date)).join(", ")}
              />
            ) : null}
            {announcement.location ? (
              <MetaRow label={labels.location} value={announcement.location} />
            ) : null}
            <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
              <dt className="text-sm font-medium text-muted">{labels.body}</dt>
              <dd className="whitespace-pre-wrap text-sm text-foreground">{announcement.body}</dd>
            </div>
            {announcement.attachments.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
                <dt className="text-sm font-medium text-muted">{labels.attachments}</dt>
                <dd className="flex flex-col gap-2">
                  {announcement.attachments.map((attachment) => (
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
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
