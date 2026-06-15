"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";

import { FieldErrorSummary } from "@/components/registration/field-error-summary";
import { FormField } from "@/components/registration/form-field";
import { ContactListField } from "@/components/shared/contact-list-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
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
  errors: FieldErrors<HouseholdPersonsFormValues>;
};

const LANGUAGE_OPTIONS = [
  { value: "fr", labelKey: "preferredLanguageFr" as const },
  { value: "mg", labelKey: "preferredLanguageMg" as const },
] as const;

export function MemberAdultFields({
  fieldPrefix,
  control,
  register,
  errors,
}: MemberAdultFieldsProps) {
  const tForm = useTranslations("form.person");
  const memberErrors = getMemberFieldErrors(errors, fieldPrefix);
  const languageError = memberErrors?.preferred_language?.message;

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

      <Controller
        name={`${fieldPrefix}.emails`}
        control={control}
        render={({ field }) => (
          <ContactListField
            label={tForm("emailOptional")}
            type="email"
            values={field.value}
            onChange={field.onChange}
            addLabel={tForm("addEmail")}
            removeLabel={tForm("removeEmail")}
            error={memberErrors?.emails?.message}
          />
        )}
      />

      <Controller
        name={`${fieldPrefix}.phones`}
        control={control}
        render={({ field }) => (
          <ContactListField
            label={tForm("phoneOptional")}
            type="tel"
            values={field.value}
            onChange={field.onChange}
            addLabel={tForm("addPhone")}
            removeLabel={tForm("removePhone")}
            error={memberErrors?.phones?.message}
          />
        )}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldPrefix}.preferred_language`}
          className="text-sm font-medium text-foreground"
        >
          {tForm("preferredLanguage")}
        </label>
        <Controller
          name={`${fieldPrefix}.preferred_language`}
          control={control}
          render={({ field }) => (
            <Select
              id={`${fieldPrefix}.preferred_language`}
              hasError={Boolean(languageError)}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            >
              <option value="">{tForm("preferredLanguagePlaceholder")}</option>
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tForm(opt.labelKey)}
                </option>
              ))}
            </Select>
          )}
        />
        {languageError ? (
          <p className="text-sm font-medium text-status-error" role="alert">
            {languageError}
          </p>
        ) : null}
      </div>

      <FormField
        label={tForm("age")}
        type="number"
        min={MIN_ADULT_AGE}
        max={120}
        inputMode="numeric"
        error={memberErrors?.age?.message}
        {...register(`${fieldPrefix}.age`)}
      />

      <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
        <Checkbox {...register(`${fieldPrefix}.is_visible_in_directory`)} />
        {tForm("visibleInDirectory")}
      </label>
    </div>
  );
}
