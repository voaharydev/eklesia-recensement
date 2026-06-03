"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import {
  householdSchema,
  type HouseholdFormValues,
} from "@/lib/validations/registration";

type HouseholdStepProps = {
  defaultValues: HouseholdFormValues;
  onSubmit: (values: HouseholdFormValues) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  afterForm?: ReactNode;
};

export function HouseholdStep({
  defaultValues,
  onSubmit,
  onBack,
  isSubmitting,
  afterForm,
}: HouseholdStepProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdSchema),
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
        label="Nom du foyer"
        placeholder="Ex. Famille Rakoto"
        error={errors.name?.message}
        {...register("name")}
      />
      <FormField
        label="Adresse principale"
        placeholder="Ex. 12 rue de l'Église, Antananarivo"
        error={errors.main_address?.message}
        {...register("main_address")}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Retour
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Enregistrement…" : "Continuer"}
        </button>
      </div>

      {afterForm}
    </form>
  );
}
