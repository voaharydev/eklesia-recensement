"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import {
  emailLookupSchema,
  type EmailLookupFormValues,
} from "@/lib/validations/registration";

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
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailLookupFormValues>({
    resolver: zodResolver(emailLookupSchema),
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
      <p className="text-sm text-gray-600">
        Saisissez votre courriel pour retrouver les informations de votre foyer
        si elles existent déjà.
      </p>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <FormField
            label="Courriel"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            error={errors.email?.message}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
          />
        )}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Recherche…" : "Continuer"}
      </button>
    </form>
  );
}
