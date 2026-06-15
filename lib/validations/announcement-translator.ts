import type { ValidationTranslator } from "@/lib/validations/create-schemas";

const ANNOUNCEMENT_VALIDATION_KEYS = new Set([
  "branchRequired",
  "branchInvalid",
  "subjectRequired",
  "eventDateInvalid",
  "eventDatesTooMany",
  "eventDatesDuplicate",
  "bodyRequired",
  "invalidData",
  "attachmentInvalidType",
  "attachmentTooLarge",
  "attachmentTooMany",
]);

export function createAnnouncementTranslator(
  tAnnouncements: ValidationTranslator,
  tValidation: ValidationTranslator,
): ValidationTranslator {
  return (key, values) => {
    if (ANNOUNCEMENT_VALIDATION_KEYS.has(key)) {
      return tAnnouncements(key, values);
    }
    return tValidation(key, values);
  };
}
