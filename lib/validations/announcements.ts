import { z } from "zod";

import { BRANCH_CODES, type BranchCode } from "@/lib/constants/branches";
import { createFormatZodError } from "@/lib/validations/format-zod-error";
import type { ValidationTranslator } from "@/lib/validations/create-schemas";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const ANNOUNCEMENT_EVENT_DATES_MAX = 10;

function optionalTextToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEventDates(dates: string[]): string[] {
  const trimmed = dates.map((date) => date.trim()).filter(Boolean);
  const unique = Array.from(new Set(trimmed));
  return unique.sort();
}

export function createAnnouncementFormSchema(t: ValidationTranslator) {
  return z.object({
    branch_code: z
      .string({ error: t("branchRequired") })
      .min(1, t("branchRequired"))
      .refine(
        (value): value is BranchCode =>
          (BRANCH_CODES as readonly string[]).includes(value),
        { message: t("branchInvalid") },
      ),
    verse: z.string().optional().or(z.literal("")),
    subject: z
      .string({ error: t("subjectRequired") })
      .trim()
      .min(1, t("subjectRequired"))
      .max(300),
    event_dates: z
      .array(
        z.object({
          date: z.string(),
        }),
      )
      .superRefine((entries, ctx) => {
        const trimmed = entries
          .map((entry) => entry.date.trim())
          .filter(Boolean);

        for (const date of trimmed) {
          if (!ISO_DATE.test(date)) {
            ctx.addIssue({
              code: "custom",
              message: t("eventDateInvalid"),
            });
            return;
          }
        }

        if (trimmed.length !== new Set(trimmed).size) {
          ctx.addIssue({
            code: "custom",
            message: t("eventDatesDuplicate"),
          });
          return;
        }

        if (trimmed.length > ANNOUNCEMENT_EVENT_DATES_MAX) {
          ctx.addIssue({
            code: "custom",
            message: t("eventDatesTooMany", { max: ANNOUNCEMENT_EVENT_DATES_MAX }),
          });
        }
      }),
    location: z.string().optional().or(z.literal("")),
    body: z
      .string({ error: t("bodyRequired") })
      .trim()
      .min(1, t("bodyRequired"))
      .max(10000),
  });
}

export type AnnouncementFormValues = {
  branch_code: string;
  verse?: string;
  subject: string;
  event_dates: Array<{ date: string }>;
  location?: string;
  body: string;
};

export type ParsedAnnouncementValues = {
  branch_code: BranchCode;
  verse: string | null;
  subject: string;
  event_dates: string[];
  location: string | null;
  body: string;
};

function toInsertValues(values: AnnouncementFormValues): ParsedAnnouncementValues {
  return {
    branch_code: values.branch_code as BranchCode,
    verse: optionalTextToNull(values.verse),
    subject: values.subject.trim(),
    event_dates: normalizeEventDates(
      (values.event_dates ?? []).map((entry) => entry.date),
    ),
    location: optionalTextToNull(values.location),
    body: values.body.trim(),
  };
}

export function parseAnnouncementForm(
  data: unknown,
  t: ValidationTranslator,
):
  | { success: true; data: ParsedAnnouncementValues }
  | { success: false; error: string } {
  const schema = createAnnouncementFormSchema(t);
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return {
      success: false,
      error: createFormatZodError(t)(parsed.error),
    };
  }

  return { success: true, data: toInsertValues(parsed.data) };
}
