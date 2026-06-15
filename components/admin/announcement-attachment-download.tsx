"use client";

import { useState, useTransition } from "react";

import { getAnnouncementAttachmentSignedUrl } from "@/app/actions/announcements";
import { Button } from "@/components/ui/button";

type AnnouncementAttachmentDownloadProps = {
  attachmentId: string;
  fileName: string;
  labels: {
    download: string;
    downloading: string;
    error: string;
  };
};

export function AnnouncementAttachmentDownload({
  attachmentId,
  fileName,
  labels,
}: AnnouncementAttachmentDownloadProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDownload() {
    setError(null);

    startTransition(async () => {
      const result = await getAnnouncementAttachmentSignedUrl({ id: attachmentId });

      if (result.error || !result.data) {
        setError(result.error ?? labels.error);
        return;
      }

      window.open(result.data.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-foreground">{fileName}</span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isPending}
          onClick={handleDownload}
        >
          {isPending ? labels.downloading : labels.download}
        </Button>
      </div>
      {error ? <p className="text-sm text-status-error">{error}</p> : null}
    </div>
  );
}
