"use client";

import type {
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import { MAX_CHILD_AGE } from "@/lib/constants/ages";
import type { HouseholdPersonsFormValues } from "@/lib/validations/registration";

type HouseholdChildFieldsProps = {
  index: number;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  watch: UseFormWatch<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>["children"];
};

export function HouseholdChildFields({
  index,
  register,
  watch,
  errors,
}: HouseholdChildFieldsProps) {
  const childErrors = errors?.[index];
  const isBaptized = watch(`children.${index}.is_baptized`);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Prénom"
          error={childErrors?.first_name?.message}
          {...register(`children.${index}.first_name`)}
        />
        <FormField
          label="Nom"
          error={childErrors?.last_name?.message}
          {...register(`children.${index}.last_name`)}
        />
      </div>

      <FormField
        label="Âge"
        type="number"
        min={0}
        max={MAX_CHILD_AGE}
        inputMode="numeric"
        error={childErrors?.age?.message}
        {...register(`children.${index}.age`)}
      />

      <div
        className={`rounded-md border p-3 ${
          childErrors?.baptized_since?.message
            ? "border-red-300 bg-red-50/60"
            : "border-gray-100 bg-gray-50"
        }`}
      >
        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            {...register(`children.${index}.is_baptized`)}
          />
          Baptisé(e)
        </label>
        {isBaptized ? (
          <div className="mt-3">
            <FormField
              label="Baptisé(e) depuis"
              type="date"
              error={childErrors?.baptized_since?.message}
              {...register(`children.${index}.baptized_since`)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
