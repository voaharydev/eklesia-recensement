"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import { BRANCH_OPTIONS, type BranchCode } from "@/lib/constants/branches";
import {
  BRANCH_ROLE_OTHER,
  getBranchRoleOptions,
  getDefaultBranchRoleForm,
} from "@/lib/constants/branch-roles";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import {
  getMemberFieldErrors,
  type MemberFieldPrefix,
} from "@/lib/registration/person-form-ui";
import type {
  BranchAssignmentFormValues,
  HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

type MemberBranchesFieldProps = {
  fieldPrefix: MemberFieldPrefix;
  control: Control<HouseholdPersonsFormValues>;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  setValue: UseFormSetValue<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>;
};

function getFirstAvailableBranchCode(
  usedCodes: Set<string>,
): BranchAssignmentFormValues["branch_code"] | null {
  const available = BRANCH_OPTIONS.find((b) => !usedCodes.has(b.code));
  return available?.code ?? null;
}

type BranchRowProps = {
  fieldPrefix: MemberFieldPrefix;
  branchIndex: number;
  branchCodeError?: string;
  rolePresetError?: string;
  roleCustomError?: string;
  selectedInRow: BranchCode | undefined;
  otherUsedCodes: Set<string>;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  setValue: UseFormSetValue<HouseholdPersonsFormValues>;
  control: Control<HouseholdPersonsFormValues>;
  remove: (index: number) => void;
  humanizeZodFieldMessage: (message: string) => string;
};

function BranchRow({
  fieldPrefix,
  branchIndex,
  branchCodeError,
  rolePresetError,
  roleCustomError,
  selectedInRow,
  otherUsedCodes,
  register,
  setValue,
  control,
  remove,
  humanizeZodFieldMessage,
}: BranchRowProps) {
  const t = useTranslations("form.branches");
  const tRole = useTranslations("form.branches.roleOptions");
  const basePath = `${fieldPrefix}.branches.${branchIndex}` as const;

  const branchCode = useWatch({
    control,
    name: `${basePath}.branch_code`,
  }) as BranchCode;

  const roleMode = useWatch({
    control,
    name: `${basePath}.role_mode`,
  });
  const rolePreset = useWatch({
    control,
    name: `${basePath}.role_preset`,
  });

  const roleOptions = getBranchRoleOptions(branchCode);
  const previousBranchCodeRef = useRef(branchCode);

  useEffect(() => {
    if (previousBranchCodeRef.current === branchCode) return;
    previousBranchCodeRef.current = branchCode;

    const defaults = getDefaultBranchRoleForm(branchCode);
    setValue(`${basePath}.role_mode`, defaults.role_mode, {
      shouldValidate: true,
    });
    setValue(`${basePath}.role_preset`, defaults.role_preset, {
      shouldValidate: true,
    });
    setValue(`${basePath}.role_custom`, defaults.role_custom, {
      shouldValidate: true,
    });
  }, [branchCode, basePath, setValue]);

  return (
    <li
      className={`rounded-md border p-3 ${
        branchCodeError || rolePresetError || roleCustomError
          ? "border-red-300 bg-red-50/60"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`${basePath}.branch_code`}
            className={`mb-1.5 block text-sm font-medium ${
              branchCodeError ? "text-red-800" : "text-gray-700"
            }`}
          >
            {t("branchLabel")}
          </label>
          <select
            id={`${basePath}.branch_code`}
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
              branchCodeError
                ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
            aria-invalid={Boolean(branchCodeError)}
            {...register(`${basePath}.branch_code`)}
          >
            {BRANCH_OPTIONS.map((option) => (
              <option
                key={option.code}
                value={option.code}
                disabled={
                  otherUsedCodes.has(option.code) &&
                  selectedInRow !== option.code
                }
              >
                {option.label}
              </option>
            ))}
          </select>
          {branchCodeError ? (
            <p className="mt-1 text-sm font-medium text-red-600" role="alert">
              {humanizeZodFieldMessage(branchCodeError)}
            </p>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <label
              htmlFor={`${basePath}.role_select`}
              className={`mb-1.5 block text-sm font-medium ${
                rolePresetError ? "text-red-800" : "text-gray-700"
              }`}
            >
              {t("roleLabel")}
            </label>
            <select
              id={`${basePath}.role_select`}
              className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                rolePresetError
                  ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              }`}
              value={
                roleMode === "other"
                  ? BRANCH_ROLE_OTHER
                  : (rolePreset ?? roleOptions[0]?.code ?? "")
              }
              onChange={(event) => {
                const value = event.target.value;
                if (value === BRANCH_ROLE_OTHER) {
                  setValue(`${basePath}.role_mode`, "other", {
                    shouldValidate: true,
                  });
                  setValue(`${basePath}.role_custom`, "", {
                    shouldValidate: true,
                  });
                  return;
                }
                setValue(`${basePath}.role_mode`, "preset", {
                  shouldValidate: true,
                });
                setValue(`${basePath}.role_preset`, value, {
                  shouldValidate: true,
                });
                setValue(`${basePath}.role_custom`, "", {
                  shouldValidate: true,
                });
              }}
            >
              {roleOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {tRole(option.code)}
                </option>
              ))}
              <option value={BRANCH_ROLE_OTHER}>{t("roleOther")}</option>
            </select>
            {rolePresetError ? (
              <p className="mt-1 text-sm font-medium text-red-600" role="alert">
                {humanizeZodFieldMessage(rolePresetError)}
              </p>
            ) : null}
          </div>

          {roleMode === "other" ? (
            <FormField
              label={t("roleCustomLabel")}
              placeholder={t("roleCustomPlaceholder")}
              error={roleCustomError}
              {...register(`${basePath}.role_custom`)}
            />
          ) : null}

          <input type="hidden" {...register(`${basePath}.role_mode`)} />
          <input type="hidden" {...register(`${basePath}.role_preset`)} />
          {roleMode !== "other" ? (
            <input type="hidden" {...register(`${basePath}.role_custom`)} />
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => remove(branchIndex)}
          className="shrink-0 self-end text-sm text-red-600 hover:text-red-700 sm:self-center"
        >
          {t("remove")}
        </button>
      </div>
    </li>
  );
}

export function MemberBranchesField({
  fieldPrefix,
  control,
  register,
  setValue,
  errors,
}: MemberBranchesFieldProps) {
  const t = useTranslations("form.branches");
  const { humanizeZodFieldMessage } = useRegistrationSchemas();
  const memberErrors = getMemberFieldErrors(errors, fieldPrefix);
  const branchesErrors = memberErrors?.branches;

  const { fields, append, remove } = useFieldArray({
    control,
    name: `${fieldPrefix}.branches`,
  });

  const watchedBranches =
    useWatch({
      control,
      name: `${fieldPrefix}.branches`,
    }) ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">{t("title")}</span>
        <p className="text-xs text-gray-500">{t("hint")}</p>
      </div>

      {typeof branchesErrors?.message === "string" ? (
        <p className="text-sm font-medium text-red-600" role="alert">
          {humanizeZodFieldMessage(branchesErrors.message)}
        </p>
      ) : null}

      {fields.length === 0 ? (
        <p className="text-sm text-gray-500">{t("none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {fields.map((field, branchIndex) => {
            const rowErrors = Array.isArray(branchesErrors)
              ? branchesErrors[branchIndex]
              : undefined;

            return (
              <BranchRow
                key={field.id}
                fieldPrefix={fieldPrefix}
                branchIndex={branchIndex}
                branchCodeError={rowErrors?.branch_code?.message}
                rolePresetError={rowErrors?.role_preset?.message}
                roleCustomError={rowErrors?.role_custom?.message}
                selectedInRow={
                  watchedBranches[branchIndex]?.branch_code as
                    | BranchCode
                    | undefined
                }
                otherUsedCodes={
                  new Set(
                    watchedBranches.flatMap((b, i) =>
                      i !== branchIndex && b?.branch_code
                        ? [b.branch_code]
                        : [],
                    ),
                  )
                }
                register={register}
                setValue={setValue}
                control={control}
                remove={remove}
                humanizeZodFieldMessage={humanizeZodFieldMessage}
              />
            );
          })}
        </ul>
      )}

      {fields.length < BRANCH_OPTIONS.length ? (
        <button
          type="button"
          onClick={() => {
            const used = new Set(
              watchedBranches.flatMap((b) =>
                b?.branch_code ? [b.branch_code] : [],
              ),
            );
            const nextCode = getFirstAvailableBranchCode(used);
            if (!nextCode) return;
            append({
              branch_code: nextCode,
              ...getDefaultBranchRoleForm(nextCode),
            });
          }}
          className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {t("add")}
        </button>
      ) : null}
    </div>
  );
}
