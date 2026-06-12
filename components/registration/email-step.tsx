"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import { WizardActionBar } from "@/components/registration/wizard-action-bar";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import type { EmailLookupFormValues } from "@/lib/validations/registration";

type EmailStepProps = {
  defaultEmail?: string;
  onSubmit: (values: EmailLookupFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function EmailStep({
  defaultEmail = "",
  onSubmit,
  isSubmitting,
}: EmailStepProps) {
  const t = useTranslations("form.email");
  const { schemas } = useRegistrationSchemas();
  const resolver = useMemo(
    () => zodResolver(schemas.emailLookupSchema),
    [schemas],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailLookupFormValues>({
    resolver,
    defaultValues: {
      email: defaultEmail,
    },
  });

  useEffect(() => {
    reset({ email: defaultEmail });
  }, [defaultEmail, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <p className="text-sm text-muted">{t("intro")}</p>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <FormField
            label={t("label")}
            type="email"
            autoComplete="email"
            placeholder={t("placeholder")}
            error={errors.email?.message}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        )}
      />
      <WizardActionBar
        submitLabel={t("submit")}
        submittingLabel={t("submitting")}
        isSubmitting={isSubmitting}
        showBack={false}
      />
    </form>
  );
}
