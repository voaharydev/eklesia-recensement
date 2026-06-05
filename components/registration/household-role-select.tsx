"use client";

import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import {
  ADULT_FORM_HOUSEHOLD_ROLES,
  type AdultFormHouseholdRole,
} from "@/lib/constants/person-roles";
import type { MemberFieldPrefix } from "@/lib/registration/person-form-ui";
import { getMemberFieldErrors } from "@/lib/registration/person-form-ui";
import type { HouseholdPersonsFormValues } from "@/lib/validations/registration";

type HouseholdRoleSelectProps = {
  fieldPrefix: MemberFieldPrefix;
  register: UseFormRegister<HouseholdPersonsFormValues>;
  errors: FieldErrors<HouseholdPersonsFormValues>;
  isHead?: boolean;
  showPromoteButton?: boolean;
  onRoleChange?: (role: AdultFormHouseholdRole) => void;
  onPromoteToHead?: () => void;
  demoteBlockedMessage?: string | null;
};

const ROLE_LABEL_KEYS: Record<
  AdultFormHouseholdRole,
  "householdRoleChef" | "householdRoleSpouse" | "householdRoleOther"
> = {
  chef_de_famille: "householdRoleChef",
  conjoint: "householdRoleSpouse",
  autre: "householdRoleOther",
};

export function HouseholdRoleSelect({
  fieldPrefix,
  register,
  errors,
  isHead = false,
  showPromoteButton = false,
  onRoleChange,
  onPromoteToHead,
  demoteBlockedMessage,
}: HouseholdRoleSelectProps) {
  const tForm = useTranslations("form.person");
  const tWizard = useTranslations("wizard.sections");
  const memberErrors = getMemberFieldErrors(errors, fieldPrefix);
  const roleField = `${fieldPrefix}.household_role` as const;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-gray-800">{tForm("householdRole")}</span>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          {...register(roleField, {
            onChange: (event) => {
              onRoleChange?.(event.target.value as AdultFormHouseholdRole);
            },
          })}
        >
          {ADULT_FORM_HOUSEHOLD_ROLES.map((role) => (
            <option key={role} value={role}>
              {tForm(ROLE_LABEL_KEYS[role])}
            </option>
          ))}
        </select>
        {memberErrors?.household_role?.message ? (
          <span className="text-sm text-red-600" role="alert">
            {memberErrors.household_role.message}
          </span>
        ) : null}
        {demoteBlockedMessage ? (
          <span className="text-sm text-amber-700" role="status">
            {demoteBlockedMessage}
          </span>
        ) : null}
      </label>

      {showPromoteButton && !isHead ? (
        <button
          type="button"
          onClick={onPromoteToHead}
          className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {tWizard("promoteToHead")}
        </button>
      ) : null}
    </div>
  );
}
