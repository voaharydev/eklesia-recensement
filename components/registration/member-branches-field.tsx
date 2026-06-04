"use client";

import { useTranslations } from "next-intl";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";

import { FormField } from "@/components/registration/form-field";
import { BRANCH_OPTIONS } from "@/lib/constants/branches";
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
  errors: FieldErrors<HouseholdPersonsFormValues>;
};

function getFirstAvailableBranchCode(
  usedCodes: Set<string>,
): BranchAssignmentFormValues["branch_code"] | null {
  const available = BRANCH_OPTIONS.find((b) => !usedCodes.has(b.code));
  return available?.code ?? null;
}

export function MemberBranchesField({
  fieldPrefix,
  control,
  register,
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
            const branchCodeError = rowErrors?.branch_code?.message;
            const roleError = rowErrors?.role?.message;

            const selectedInRow = watchedBranches[branchIndex]?.branch_code;

            const otherUsedCodes = new Set(
              watchedBranches.flatMap((b, i) =>
                i !== branchIndex && b?.branch_code ? [b.branch_code] : [],
              ),
            );

            return (
              <li
                key={field.id}
                className={`rounded-md border p-3 ${
                  branchCodeError || roleError
                    ? "border-red-300 bg-red-50/60"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`${fieldPrefix}.branches.${branchIndex}.branch_code`}
                      className={`mb-1.5 block text-sm font-medium ${
                        branchCodeError ? "text-red-800" : "text-gray-700"
                      }`}
                    >
                      {t("branchLabel")}
                    </label>
                    <select
                      id={`${fieldPrefix}.branches.${branchIndex}.branch_code`}
                      className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                        branchCodeError
                          ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                      }`}
                      aria-invalid={Boolean(branchCodeError)}
                      {...register(
                        `${fieldPrefix}.branches.${branchIndex}.branch_code`,
                      )}
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
                      <p
                        className="mt-1 text-sm font-medium text-red-600"
                        role="alert"
                      >
                        {humanizeZodFieldMessage(branchCodeError)}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <FormField
                      label={t("roleOptional")}
                      placeholder={t("rolePlaceholder")}
                      error={roleError}
                      {...register(
                        `${fieldPrefix}.branches.${branchIndex}.role`,
                      )}
                    />
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
            append({ branch_code: nextCode, role: "" });
          }}
          className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {t("add")}
        </button>
      ) : null}
    </div>
  );
}
