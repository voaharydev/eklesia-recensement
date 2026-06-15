import {
  ANNOUNCEMENT_ATTACHMENT_MAX_BYTES,
  ANNOUNCEMENT_ATTACHMENT_MAX_COUNT,
  isAllowedAnnouncementAttachment,
} from "@/lib/announcements/attachment-rules";
import type { ValidationTranslator } from "@/lib/validations/create-schemas";

export function parseAnnouncementFormData(formData: FormData) {
  const eventDates = formData
    .getAll("event_dates")
    .map((value) => value.toString())
    .filter(Boolean);

  return {
    branch_code: formData.get("branch_code")?.toString() ?? "",
    verse: formData.get("verse")?.toString() ?? "",
    subject: formData.get("subject")?.toString() ?? "",
    event_dates: eventDates.map((date) => ({ date })),
    location: formData.get("location")?.toString() ?? "",
    body: formData.get("body")?.toString() ?? "",
  };
}

export function getAnnouncementAttachmentsFromFormData(formData: FormData): File[] {
  return formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0);
}

export function validateAnnouncementAttachments(
  files: File[],
  t: ValidationTranslator,
): string | null {
  if (files.length > ANNOUNCEMENT_ATTACHMENT_MAX_COUNT) {
    return t("attachmentTooMany", { max: ANNOUNCEMENT_ATTACHMENT_MAX_COUNT });
  }

  for (const file of files) {
    if (file.size > ANNOUNCEMENT_ATTACHMENT_MAX_BYTES) {
      return t("attachmentTooLarge", {
        maxMb: ANNOUNCEMENT_ATTACHMENT_MAX_BYTES / (1024 * 1024),
      });
    }

    if (!isAllowedAnnouncementAttachment(file)) {
      return t("attachmentInvalidType");
    }
  }

  return null;
}
