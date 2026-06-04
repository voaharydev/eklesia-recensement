"use client";

import { useTranslations } from "next-intl";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";

import { FieldErrorSummary } from "@/components/registration/field-error-summary";
import { FormField } from "@/components/registration/form-field";
import { MemberChurchFields } from "@/components/registration/member-church-fields";
import { MIN_ADULT_AGE } from "@/lib/constants/ages";
import {
  adultHasErrors,
  getAdultErrorMessages,
  getMemberFieldErrors,
  type MemberFieldPrefix,
} from "@/lib/registration/person-form-ui";
import type { HouseholdPersonsFormValues } from "@/lib/validations/registration";

type MemberAdultFieldsProps = {
  fieldPrefix: MemberFieldPrefix;
  control: Control<HouseholdPersonsFormValues>;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  watch: UseFormWatch<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>;
  onToggleChurch: () => void;
  isChurchExpanded: boolean;
};

export function MemberAdultFields({
  fieldPrefix,
  control,
  register,
  watch,
  errors,
  onToggleChurch,
  isChurchExpanded,
}: MemberAdultFieldsProps) {
  const tForm = useTranslations("form.person");
  const memberErrors = getMemberFieldErrors(errors, fieldPrefix);

  return (
    <div className="flex flex-col gap-4">
      {adultHasErrors(errors, fieldPrefix) ? (
        <FieldErrorSummary messages={getAdultErrorMessages(errors, fieldPrefix)} />
      ) : null}

      <FormField
        label={tForm("civility")}
        placeholder={tForm("civilityPlaceholder")}
        error={memberErrors?.civility?.message}
        {...register(`${fieldPrefix}.civility`)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label={tForm("firstName")}
          error={memberErrors?.first_name?.message}
          {...register(`${fieldPrefix}.first_name`)}
        />
        <FormField
          label={tForm("lastName")}
          error={memberErrors?.last_name?.message}
          {...register(`${fieldPrefix}.last_name`)}
        />
      </div>

      <FormField
        label={tForm("emailOptional")}
        type="email"
        error={memberErrors?.email?.message}
        {...register(`${fieldPrefix}.email`)}
      />
      <FormField
        label={tForm("phoneOptional")}
        type="tel"
        error={memberErrors?.phone?.message}
        {...register(`${fieldPrefix}.phone`)}
      />
      <FormField
        label={tForm("preferredLanguage")}
        error={memberErrors?.preferred_language?.message}
        {...register(`${fieldPrefix}.preferred_language`)}
      />
      <FormField
        label={tForm("age")}
        type="number"
        min={MIN_ADULT_AGE}
        max={120}
        inputMode="numeric"
        error={memberErrors?.age?.message}
        {...register(`${fieldPrefix}.age`)}
      />

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...register(`${fieldPrefix}.is_visible_in_directory`)}
        />
        {tForm("visibleInDirectory")}
      </label>

      <MemberChurchFields
        fieldPrefix={fieldPrefix}
        control={control}
        register={register}
        watch={watch}
        errors={errors}
        isExpanded={isChurchExpanded}
        onToggle={onToggleChurch}
      />
    </div>
  );
}
