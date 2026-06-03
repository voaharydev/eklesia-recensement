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
import { MemberBranchesField } from "@/components/registration/member-branches-field";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import { collectFieldErrorMessages } from "@/lib/registration/person-form-ui";
import type { HouseholdPersonsFormValues } from "@/lib/validations/registration";

type MemberChurchFieldsProps = {
  index: number;
  control: Control<HouseholdPersonsFormValues>;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  watch: UseFormWatch<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>["members"];
  isExpanded: boolean;
  onToggle: () => void;
};

function CheckboxWithDate({
  enabled,
  flagLabel,
  dateLabel,
  dateError,
  flagRegister,
  dateRegister,
}: {
  enabled: boolean;
  flagLabel: string;
  dateLabel: string;
  dateError?: string;
  flagRegister: ReturnType<UseFormRegister<HouseholdPersonsFormValues>>;
  dateRegister: ReturnType<UseFormRegister<HouseholdPersonsFormValues>>;
}) {
  const hasDateError = Boolean(dateError);

  return (
    <div
      className={`rounded-md border p-3 ${
        hasDateError
          ? "border-red-300 bg-red-50/60"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...flagRegister}
        />
        {flagLabel}
      </label>
      {enabled ? (
        <div className="mt-3">
          <FormField
            label={dateLabel}
            type="date"
            error={dateError}
            {...dateRegister}
          />
        </div>
      ) : null}
    </div>
  );
}

export function MemberChurchFields({
  index,
  control,
  register,
  watch,
  errors,
  isExpanded,
  onToggle,
}: MemberChurchFieldsProps) {
  const t = useTranslations("form.church");
  const { humanizeZodFieldMessage } = useRegistrationSchemas();
  const memberErrors = errors?.[index];
  const isBaptized = watch(`members.${index}.is_baptized`);
  const isMpiandry = watch(`members.${index}.is_mpiandry`);
  const isMpandray = watch(`members.${index}.is_mpandray`);

  const branchMessages = collectFieldErrorMessages(
    memberErrors?.branches as Record<string, unknown> | undefined,
  ).map((message) => humanizeZodFieldMessage(message));

  const churchOnlyMessages = [
    memberErrors?.baptized_since?.message,
    memberErrors?.mpiandry_since?.message,
    memberErrors?.mpandray_since?.message,
    ...branchMessages,
  ]
    .filter((m): m is string => Boolean(m))
    .map((message) => humanizeZodFieldMessage(message));

  const hasSectionError = churchOnlyMessages.length > 0;

  return (
    <div
      className={`border-t pt-4 ${hasSectionError ? "border-red-200" : "border-gray-100"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span
          className={`text-sm font-semibold ${hasSectionError ? "text-red-800" : "text-gray-800"}`}
        >
          {t("title")}
          {hasSectionError && !isExpanded ? (
            <span className="ml-2 text-xs font-medium text-red-600">
              {t("toFixCount", { count: churchOnlyMessages.length })}
            </span>
          ) : null}
        </span>
        <span
          className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {!isExpanded && hasSectionError ? (
        <div className="mt-2">
          <FieldErrorSummary messages={churchOnlyMessages} />
        </div>
      ) : null}

      {isExpanded ? (
        <div className="mt-4 flex flex-col gap-4">
          {churchOnlyMessages.length > 0 ? (
            <FieldErrorSummary messages={churchOnlyMessages} />
          ) : null}

          <CheckboxWithDate
            enabled={isBaptized}
            flagLabel={t("baptized")}
            dateLabel={t("baptizedSince")}
            dateError={memberErrors?.baptized_since?.message}
            flagRegister={register(`members.${index}.is_baptized`)}
            dateRegister={register(`members.${index}.baptized_since`)}
          />

          <CheckboxWithDate
            enabled={isMpiandry}
            flagLabel={t("mpiandry")}
            dateLabel={t("mpiandrySince")}
            dateError={memberErrors?.mpiandry_since?.message}
            flagRegister={register(`members.${index}.is_mpiandry`)}
            dateRegister={register(`members.${index}.mpiandry_since`)}
          />

          <CheckboxWithDate
            enabled={isMpandray}
            flagLabel={t("mpandray")}
            dateLabel={t("mpandraySince")}
            dateError={memberErrors?.mpandray_since?.message}
            flagRegister={register(`members.${index}.is_mpandray`)}
            dateRegister={register(`members.${index}.mpandray_since`)}
          />

          <MemberBranchesField
            index={index}
            control={control}
            register={register}
            errors={errors}
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`members.${index}.church_assignments`}
              className="text-sm font-medium text-gray-700"
            >
              {t("assignments")}
            </label>
            <textarea
              id={`members.${index}.church_assignments`}
              rows={3}
              placeholder={t("assignmentsPlaceholder")}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register(`members.${index}.church_assignments`)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
