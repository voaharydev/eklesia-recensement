"use client";

import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
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
  const roleError = memberErrors?.household_role?.message;

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">{tForm("householdRole")}</span>
        <Select
          hasError={Boolean(roleError)}
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
        </Select>
        {roleError ? (
          <span className="text-sm text-status-error" role="alert">
            {roleError}
          </span>
        ) : null}
        {demoteBlockedMessage ? (
          <span className="text-sm text-status-warning" role="status">
            {demoteBlockedMessage}
          </span>
        ) : null}
      </label>

      {showPromoteButton && !isHead ? (
        <Button type="button" variant="ghost" size="sm" onClick={onPromoteToHead}>
          {tWizard("promoteToHead")}
        </Button>
      ) : null}
    </div>
  );
}
