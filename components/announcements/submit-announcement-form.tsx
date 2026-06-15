"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { submitAnnouncement } from "@/app/actions/announcements";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ANNOUNCEMENT_ATTACHMENT_MAX_COUNT,
  formatAttachmentAcceptAttribute,
  formatAttachmentMaxSizeMb,
} from "@/lib/announcements/attachment-rules";
import { validateAnnouncementAttachments } from "@/lib/announcements/form-data";
import { BRANCH_OPTIONS } from "@/lib/constants/branches";
import { cn } from "@/components/ui/cn";
import {
  ANNOUNCEMENT_EVENT_DATES_MAX,
  createAnnouncementFormSchema,
  type AnnouncementFormValues,
} from "@/lib/validations/announcements";
import { createAnnouncementTranslator } from "@/lib/validations/announcement-translator";
import { createHumanizeZodFieldMessage } from "@/lib/validations/format-zod-error";

const defaultValues: AnnouncementFormValues = {
  branch_code: "",
  verse: "",
  subject: "",
  event_dates: [],
  location: "",
  body: "",
};

function FieldLabel({
  htmlFor,
  children,
  hasError,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hasError?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "text-sm font-medium",
        hasError ? "text-status-error" : "text-foreground",
      )}
    >
      {children}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm font-medium text-status-error" role="alert">
      {message}
    </p>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function SubmitAnnouncementForm() {
  const locale = useLocale();
  const t = useTranslations("announcements.submit");
  const tAnnouncements = useTranslations("validation.announcements");
  const tValidation = useTranslations("validation");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const translator = useMemo(
    () =>
      createAnnouncementTranslator(
        (key, values) => tAnnouncements(key, values),
        (key, values) => tValidation(key, values),
      ),
    [tAnnouncements, tValidation],
  );

  const schema = useMemo(() => createAnnouncementFormSchema(translator), [translator]);
  const humanize = useMemo(
    () => createHumanizeZodFieldMessage(translator),
    [translator],
  );
  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormValues>({
    resolver,
    defaultValues,
  });

  const {
    fields: eventDateFields,
    append: appendEventDate,
    remove: removeEventDate,
  } = useFieldArray({
    control,
    name: "event_dates",
  });

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentError(null);
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selected.length === 0) return;

    const merged = [...attachments, ...selected].slice(
      0,
      ANNOUNCEMENT_ATTACHMENT_MAX_COUNT,
    );
    const validationMessage = validateAnnouncementAttachments(merged, translator);

    if (validationMessage) {
      setAttachmentError(validationMessage);
      return;
    }

    setAttachments(merged);
  }

  function removeAttachment(index: number) {
    setAttachmentError(null);
    setAttachments((current) => current.filter((_, i) => i !== index));
  }

  function onSubmit(values: AnnouncementFormValues) {
    setSuccessMessage(null);
    setSubmitError(null);
    setAttachmentError(null);

    const validationMessage = validateAnnouncementAttachments(attachments, translator);
    if (validationMessage) {
      setAttachmentError(validationMessage);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("branch_code", values.branch_code);
      formData.append("verse", values.verse ?? "");
      formData.append("subject", values.subject);
      values.event_dates
        ?.map((entry) => entry.date.trim())
        .filter(Boolean)
        .forEach((date) => formData.append("event_dates", date));
      formData.append("location", values.location ?? "");
      formData.append("body", values.body);
      attachments.forEach((file) => formData.append("attachments", file));

      const result = await submitAnnouncement(locale, formData);

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      setSuccessMessage(t("success"));
      reset(defaultValues);
      setAttachments([]);
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {successMessage ? (
          <Alert variant="success" className="mb-4">
            {successMessage}
          </Alert>
        ) : null}
        {submitError ? (
          <Alert variant="error" className="mb-4">
            {submitError}
          </Alert>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="branch_code" hasError={Boolean(errors.branch_code)}>
              {t("branchLabel")}
            </FieldLabel>
            <Controller
              name="branch_code"
              control={control}
              render={({ field }) => (
                <Select
                  id="branch_code"
                  hasError={Boolean(errors.branch_code)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                >
                  <option value="">{t("branchPlaceholder")}</option>
                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch.code} value={branch.code}>
                      {branch.label}
                    </option>
                  ))}
                </Select>
              )}
            />
            <FieldError
              message={
                errors.branch_code?.message
                  ? humanize(errors.branch_code.message, "branch_code")
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="verse">{t("verseLabel")}</FieldLabel>
            <Input
              id="verse"
              placeholder={t("versePlaceholder")}
              hasError={Boolean(errors.verse)}
              {...register("verse")}
            />
            <FieldError message={errors.verse?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="subject" hasError={Boolean(errors.subject)}>
              {t("subjectLabel")}
            </FieldLabel>
            <Input
              id="subject"
              placeholder={t("subjectPlaceholder")}
              hasError={Boolean(errors.subject)}
              {...register("subject")}
            />
            <FieldError
              message={
                errors.subject?.message
                  ? humanize(errors.subject.message, "subject")
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="event_dates-0">{t("eventDatesLabel")}</FieldLabel>
            {eventDateFields.length === 0 ? (
              <p className="text-sm text-muted">{t("eventDatesEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {eventDateFields.map((field, index) => (
                  <li key={field.id} className="flex flex-wrap items-center gap-2">
                    <Input
                      id={`event_dates-${index}`}
                      type="date"
                      hasError={Boolean(errors.event_dates?.[index] ?? errors.event_dates)}
                      className="max-w-xs"
                      {...register(`event_dates.${index}.date` as const)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isPending}
                      onClick={() => removeEventDate(index)}
                    >
                      {t("removeEventDate")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={isPending || eventDateFields.length >= ANNOUNCEMENT_EVENT_DATES_MAX}
              onClick={() => appendEventDate({ date: "" })}
            >
              {t("addEventDate")}
            </Button>
            <FieldError
              message={
                errors.event_dates?.message
                  ? humanize(String(errors.event_dates.message), "event_dates")
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="location">{t("locationLabel")}</FieldLabel>
            <Input
              id="location"
              placeholder={t("locationPlaceholder")}
              hasError={Boolean(errors.location)}
              {...register("location")}
            />
            <FieldError message={errors.location?.message} />
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="body" hasError={Boolean(errors.body)}>
              {t("bodyLabel")}
            </FieldLabel>
            <textarea
              id="body"
              rows={8}
              placeholder={t("bodyPlaceholder")}
              className={cn(
                "input-base min-h-[10rem] resize-y",
                errors.body &&
                  "border-status-error bg-status-error/5 focus:border-status-error focus:ring-status-error/30",
              )}
              aria-invalid={Boolean(errors.body)}
              {...register("body")}
            />
            <FieldError
              message={
                errors.body?.message
                  ? humanize(errors.body.message, "body")
                  : undefined
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="attachments">{t("attachmentsLabel")}</FieldLabel>
            <p className="text-sm text-muted">
              {t("attachmentsHint", {
                max: ANNOUNCEMENT_ATTACHMENT_MAX_COUNT,
                maxMb: formatAttachmentMaxSizeMb(),
              })}
            </p>
            <input
              ref={fileInputRef}
              id="attachments"
              type="file"
              multiple
              accept={formatAttachmentAcceptAttribute()}
              className="hidden"
              onChange={handleFilesSelected}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              disabled={
                isPending || attachments.length >= ANNOUNCEMENT_ATTACHMENT_MAX_COUNT
              }
              onClick={() => fileInputRef.current?.click()}
            >
              {t("attachmentsAdd")}
            </Button>
            {attachmentError ? <FieldError message={attachmentError} /> : null}
            {attachments.length === 0 ? (
              <p className="text-sm text-muted">{t("attachmentsEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {attachments.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isPending}
                      onClick={() => removeAttachment(index)}
                    >
                      {t("attachmentsRemove")}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="self-start">
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
