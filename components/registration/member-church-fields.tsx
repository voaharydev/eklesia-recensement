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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/cn";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import {
  collectFieldErrorMessages,
  getMemberFieldErrors,
  type MemberFieldPrefix,
} from "@/lib/registration/person-form-ui";
import type { HouseholdPersonsFormValues } from "@/lib/validations/registration";

type MemberChurchFieldsProps = {
  fieldPrefix: MemberFieldPrefix;
  control: Control<HouseholdPersonsFormValues>;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  watch: UseFormWatch<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>;
};

function TermHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted">{children}</p>;
}

function CheckboxWithDate({
  enabled,
  flagLabel,
  hint,
  dateLabel,
  dateError,
  flagRegister,
  dateRegister,
}: {
  enabled: boolean;
  flagLabel: string;
  hint?: string;
  dateLabel: string;
  dateError?: string;
  flagRegister: ReturnType<UseFormRegister<HouseholdPersonsFormValues>>;
  dateRegister: ReturnType<UseFormRegister<HouseholdPersonsFormValues>>;
}) {
  const hasDateError = Boolean(dateError);

  return (
    <div
      className={cn(
        "rounded-md border p-3",
        hasDateError
          ? "border-status-error/40 bg-status-error/5"
          : "border-border bg-surface-muted",
      )}
    >
      <label className="flex min-h-11 items-start gap-3 text-sm font-medium text-foreground">
        <Checkbox className="mt-0.5" {...flagRegister} />
        <span>
          {flagLabel}
          {hint ? <TermHint>{hint}</TermHint> : null}
        </span>
      </label>
      {enabled ? (
        <div className="mt-3 pl-8">
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
  fieldPrefix,
  control,
  register,
  watch,
  errors,
}: MemberChurchFieldsProps) {
  const t = useTranslations("form.church");
  const { humanizeZodFieldMessage } = useRegistrationSchemas();
  const memberErrors = getMemberFieldErrors(errors, fieldPrefix);
  const isBaptized = watch(`${fieldPrefix}.is_baptized`);
  const isMpiandry = watch(`${fieldPrefix}.is_mpiandry`);
  const isMpandray = watch(`${fieldPrefix}.is_mpandray`);

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

  return (
    <div className="flex flex-col gap-4">
      {churchOnlyMessages.length > 0 ? (
        <FieldErrorSummary messages={churchOnlyMessages} />
      ) : null}

      <CheckboxWithDate
        enabled={isBaptized}
        flagLabel={t("baptized")}
        dateLabel={t("baptizedSince")}
        dateError={memberErrors?.baptized_since?.message}
        flagRegister={register(`${fieldPrefix}.is_baptized`)}
        dateRegister={register(`${fieldPrefix}.baptized_since`)}
      />

      <CheckboxWithDate
        enabled={isMpiandry}
        flagLabel={t("mpiandry")}
        hint={t("mpiandryHint")}
        dateLabel={t("mpiandrySince")}
        dateError={memberErrors?.mpiandry_since?.message}
        flagRegister={register(`${fieldPrefix}.is_mpiandry`)}
        dateRegister={register(`${fieldPrefix}.mpiandry_since`)}
      />

      <CheckboxWithDate
        enabled={isMpandray}
        flagLabel={t("mpandray")}
        hint={t("mpandrayHint")}
        dateLabel={t("mpandraySince")}
        dateError={memberErrors?.mpandray_since?.message}
        flagRegister={register(`${fieldPrefix}.is_mpandray`)}
        dateRegister={register(`${fieldPrefix}.mpandray_since`)}
      />

      <div className="rounded-md border border-border bg-surface-muted p-3">
        <label className="flex min-h-11 items-start gap-3 text-sm font-medium text-foreground">
          <Checkbox className="mt-0.5" {...register(`${fieldPrefix}.is_mpamaky_teny`)} />
          <span>
            {t("mpamakyTeny")}
            <TermHint>{t("mpamakyTenyHint")}</TermHint>
          </span>
        </label>
      </div>

      <MemberBranchesField
        fieldPrefix={fieldPrefix}
        control={control}
        register={register}
        errors={errors}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldPrefix}.church_assignments`}
          className="text-sm font-medium text-foreground"
        >
          {t("assignments")}
        </label>
        <Textarea
          id={`${fieldPrefix}.church_assignments`}
          rows={3}
          placeholder={t("assignmentsPlaceholder")}
          {...register(`${fieldPrefix}.church_assignments`)}
        />
      </div>
    </div>
  );
}
