"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import { WizardActionBar } from "@/components/registration/wizard-action-bar";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import type { HouseholdFormValues } from "@/lib/validations/registration";

type HouseholdStepProps = {
  defaultValues: HouseholdFormValues;
  onSubmit: (values: HouseholdFormValues) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
};

export function HouseholdStep({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting,
}: HouseholdStepProps) {
  const tForm = useTranslations("form.household");
  const tWizard = useTranslations("wizard.buttons");
  const { schemas } = useRegistrationSchemas();
  const resolver = useMemo(
    () => zodResolver(schemas.householdSchema),
    [schemas],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HouseholdFormValues>({
    resolver,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <FormField
        label={tForm("nameLabel")}
        placeholder={tForm("namePlaceholder")}
        error={errors.name?.message}
        {...register("name")}
      />
      <FormField
        label={tForm("addressLabel")}
        placeholder={tForm("addressPlaceholder")}
        error={errors.main_address?.message}
        {...register("main_address")}
      />
      <FormField
        label={tForm("landlinePhone")}
        type="tel"
        placeholder={tForm("landlinePhonePlaceholder")}
        error={errors.landline_phone?.message}
        {...register("landline_phone")}
      />
      <FormField
        label={tForm("arrivalDateFjkm")}
        placeholder={tForm("arrivalDateFjkmPlaceholder")}
        error={errors.arrival_date_fjkm?.message}
        {...register("arrival_date_fjkm")}
      />

      <WizardActionBar
        onBack={onBack}
        backLabel={tWizard("back")}
        submitLabel={tWizard("continue")}
        submittingLabel={tWizard("saving")}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
