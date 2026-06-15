export const ANNOUNCEMENT_ATTACHMENTS_BUCKET = "announcement-attachments";

export const ANNOUNCEMENT_ATTACHMENT_MAX_COUNT = 5;
export const ANNOUNCEMENT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

export const ANNOUNCEMENT_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".doc",
  ".docx",
] as const;

export const ANNOUNCEMENT_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  return fileName.slice(dotIndex).toLowerCase();
}

export function isAllowedAnnouncementAttachment(file: File): boolean {
  const extension = getFileExtension(file.name);
  if (
    !(ANNOUNCEMENT_ATTACHMENT_EXTENSIONS as readonly string[]).includes(extension)
  ) {
    return false;
  }

  if (file.type && ANNOUNCEMENT_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return true;
  }

  const expectedMime = EXTENSION_TO_MIME[extension];
  return !file.type || file.type === "application/octet-stream" || Boolean(expectedMime);
}

export function sanitizeAttachmentFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "file";
  const sanitized = base.replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, " ");
  return sanitized.slice(0, 200) || "file";
}

export function resolveAttachmentContentType(file: File): string {
  if (file.type && ANNOUNCEMENT_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = getFileExtension(file.name);
  return EXTENSION_TO_MIME[extension] ?? "application/octet-stream";
}

export function formatAttachmentAcceptAttribute(): string {
  return ANNOUNCEMENT_ATTACHMENT_EXTENSIONS.join(",");
}

export function formatAttachmentMaxSizeMb(): number {
  return ANNOUNCEMENT_ATTACHMENT_MAX_BYTES / (1024 * 1024);
}
