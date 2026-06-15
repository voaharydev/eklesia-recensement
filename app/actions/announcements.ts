"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import {
  ANNOUNCEMENT_ATTACHMENTS_BUCKET,
  resolveAttachmentContentType,
  sanitizeAttachmentFileName,
} from "@/lib/announcements/attachment-rules";
import {
  getAnnouncementAttachmentsFromFormData,
  parseAnnouncementFormData,
  validateAnnouncementAttachments,
} from "@/lib/announcements/form-data";
import { assertAdminSession } from "@/lib/admin/auth";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/supabase";
import { parseAnnouncementForm } from "@/lib/validations/announcements";
import { createAnnouncementTranslator } from "@/lib/validations/announcement-translator";
import type {
  AnnouncementStatus,
  AnnouncementWithAttachments,
} from "@/types/database";

async function requireAdmin(): Promise<ActionResult<never> | null> {
  try {
    await assertAdminSession();
    return null;
  } catch {
    return failure("Session admin invalide ou expirée.");
  }
}

function parseLocale(value: string): Locale {
  if (routing.locales.includes(value as Locale)) {
    return value as Locale;
  }
  return routing.defaultLocale;
}

async function getAnnouncementTranslator(locale: Locale) {
  const tAnnouncements = await getTranslations({
    locale,
    namespace: "validation.announcements",
  });
  const tValidation = await getTranslations({
    locale,
    namespace: "validation",
  });
  return createAnnouncementTranslator(
    (key, values) => tAnnouncements(key, values),
    (key, values) => tValidation(key, values),
  );
}

const updateStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

const attachmentIdSchema = z.object({
  id: z.string().uuid(),
});

async function rollbackAnnouncementSubmission(
  supabase: ReturnType<typeof createAdminClient>,
  announcementId: string,
  uploadedPaths: string[],
) {
  if (uploadedPaths.length > 0) {
    await supabase.storage.from(ANNOUNCEMENT_ATTACHMENTS_BUCKET).remove(uploadedPaths);
  }

  await supabase.from("announcements").delete().eq("id", announcementId);
}

export async function submitAnnouncement(
  locale: string,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const resolvedLocale = parseLocale(locale);
  const t = await getAnnouncementTranslator(resolvedLocale);
  const parsed = parseAnnouncementForm(parseAnnouncementFormData(formData), t);

  if (!parsed.success) {
    return failure(parsed.error);
  }

  const attachments = getAnnouncementAttachmentsFromFormData(formData);
  const attachmentError = validateAnnouncementAttachments(attachments, t);
  if (attachmentError) {
    return failure(attachmentError);
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      branch_code: parsed.data.branch_code,
      verse: parsed.data.verse,
      subject: parsed.data.subject,
      event_dates: parsed.data.event_dates,
      location: parsed.data.location,
      body: parsed.data.body,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    const tErrors = await getTranslations({
      locale: resolvedLocale,
      namespace: "errors",
    });
    return failure(mapSupabaseError(error, (key) => tErrors(key)));
  }

  const uploadedPaths: string[] = [];

  for (const file of attachments) {
    const attachmentId = crypto.randomUUID();
    const storagePath = `${data.id}/${attachmentId}/${sanitizeAttachmentFileName(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(ANNOUNCEMENT_ATTACHMENTS_BUCKET)
      .upload(storagePath, file, {
        contentType: resolveAttachmentContentType(file),
        upsert: false,
      });

    if (uploadError) {
      await rollbackAnnouncementSubmission(supabase, data.id, uploadedPaths);
      const tErrors = await getTranslations({
        locale: resolvedLocale,
        namespace: "errors",
      });
      return failure(
        uploadError.message || tErrors("announcementAttachmentUploadFailed"),
      );
    }

    uploadedPaths.push(storagePath);

    const { error: insertError } = await supabase
      .from("announcement_attachments")
      .insert({
        announcement_id: data.id,
        storage_path: storagePath,
        file_name: sanitizeAttachmentFileName(file.name),
        mime_type: resolveAttachmentContentType(file),
        file_size: file.size,
      });

    if (insertError) {
      await rollbackAnnouncementSubmission(supabase, data.id, uploadedPaths);
      const tErrors = await getTranslations({
        locale: resolvedLocale,
        namespace: "errors",
      });
      return failure(mapSupabaseError(insertError, (key) => tErrors(key)));
    }
  }

  return success({ id: data.id });
}

export async function getPendingAnnouncements(): Promise<
  ActionResult<AnnouncementWithAttachments[]>
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*, attachments:announcement_attachments(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    const tErrors = await getTranslations({ locale: "fr", namespace: "errors" });
    return failure(mapSupabaseError(error, (key) => tErrors(key)));
  }

  const announcements = (data ?? []).map((row) => ({
    ...row,
    attachments: [...(row.attachments ?? [])].sort((a, b) =>
      a.file_name.localeCompare(b.file_name, "fr"),
    ),
  }));

  return success(announcements);
}

export async function getApprovedAnnouncements(): Promise<
  ActionResult<AnnouncementWithAttachments[]>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .select("*, attachments:announcement_attachments(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    return failure(error.message);
  }

  const announcements = (data ?? []).map((row) => ({
    ...row,
    attachments: [...(row.attachments ?? [])].sort((a, b) =>
      a.file_name.localeCompare(b.file_name, "fr"),
    ),
  }));

  return success(announcements);
}

export async function getAnnouncementAttachmentSignedUrl(input: {
  id: string;
}): Promise<ActionResult<{ url: string; fileName: string }>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = attachmentIdSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Pièce jointe invalide.");
  }

  const supabase = createAdminClient();
  const { data: attachment, error } = await supabase
    .from("announcement_attachments")
    .select("id, storage_path, file_name")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (error) {
    const tErrors = await getTranslations({ locale: "fr", namespace: "errors" });
    return failure(mapSupabaseError(error, (key) => tErrors(key)));
  }

  if (!attachment) {
    return failure("Pièce jointe introuvable.");
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(ANNOUNCEMENT_ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.storage_path, 60 * 60);

  if (signedError || !signed?.signedUrl) {
    return failure("Impossible de générer le lien de téléchargement.");
  }

  return success({
    url: signed.signedUrl,
    fileName: attachment.file_name,
  });
}

export async function updateAnnouncementStatus(input: {
  id: string;
  status: AnnouncementStatus;
}): Promise<ActionResult<{ id: string; status: AnnouncementStatus }>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    const t = await getAnnouncementTranslator("fr");
    return failure(t("invalidData"));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("announcements")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("id, status")
    .maybeSingle();

  if (error) {
    const tErrors = await getTranslations({ locale: "fr", namespace: "errors" });
    return failure(mapSupabaseError(error, (key) => tErrors(key)));
  }

  if (!data) {
    return failure("Annonce introuvable ou déjà traitée.");
  }

  revalidatePath("/admin/annonces");
  revalidatePath("/admin/annonces/publiees");
  return success({ id: data.id, status: data.status });
}
