"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

import { HouseholdSearchField } from "@/components/admin/household-search-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BRANCH_ROLE_CANONICAL_LABELS } from "@/lib/constants/branch-roles";
import { BRANCH_OPTIONS } from "@/lib/constants/branches";
import { SPIRITUAL_FILTER_OPTIONS } from "@/lib/communication/parse-communication-filters";

type CommunicationFiltersProps = {
  labels: {
    filtersTitle: string;
    ageMin: string;
    ageMax: string;
    branch: string;
    branchAll: string;
    profile: string;
    profileAll: string;
    spiritualGroup: string;
    roleGroup: string;
    spiritual: Record<string, string>;
    branchRoles: Record<string, string>;
    channel: string;
    channelEmail: string;
    channelSms: string;
    household: string;
    householdPlaceholder: string;
    householdClear: string;
    householdLoading: string;
    householdNoResults: string;
  };
};

export function CommunicationFilters({ labels }: CommunicationFiltersProps) {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const ageDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitForm = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const onAgeChange = useCallback(() => {
    if (ageDebounceRef.current) {
      clearTimeout(ageDebounceRef.current);
    }
    ageDebounceRef.current = setTimeout(() => {
      submitForm();
    }, 400);
  }, [submitForm]);

  const formKey = searchParams.toString();
  const profileValue =
    searchParams.get("profile") ??
    (searchParams.get("spiritual")
      ? `spiritual:${searchParams.get("spiritual")}`
      : searchParams.get("branchRole")
        ? `role:${searchParams.get("branchRole")}`
        : "");

  return (
    <form
      ref={formRef}
      key={formKey}
      action="/admin/communication"
      method="get"
      className="space-y-4"
    >
      <p className="text-sm font-medium text-foreground">{labels.filtersTitle}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="communication-age-min"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.ageMin}
          </label>
          <Input
            id="communication-age-min"
            name="ageMin"
            type="number"
            min={0}
            defaultValue={searchParams.get("ageMin") ?? ""}
            onChange={onAgeChange}
          />
        </div>
        <div>
          <label
            htmlFor="communication-age-max"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.ageMax}
          </label>
          <Input
            id="communication-age-max"
            name="ageMax"
            type="number"
            min={0}
            defaultValue={searchParams.get("ageMax") ?? ""}
            onChange={onAgeChange}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="communication-branch"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {labels.branch}
        </label>
        <Select
          id="communication-branch"
          name="branch"
          defaultValue={searchParams.get("branch") ?? ""}
          onChange={submitForm}
        >
          <option value="">{labels.branchAll}</option>
          {BRANCH_OPTIONS.map((branch) => (
            <option key={branch.code} value={branch.code}>
              {branch.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label
          htmlFor="communication-profile"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {labels.profile}
        </label>
        <Select
          id="communication-profile"
          name="profile"
          defaultValue={profileValue}
          onChange={submitForm}
        >
          <option value="">{labels.profileAll}</option>
          <optgroup label={labels.spiritualGroup}>
            {SPIRITUAL_FILTER_OPTIONS.map((value) => (
              <option key={value} value={`spiritual:${value}`}>
                {labels.spiritual[value] ?? value}
              </option>
            ))}
          </optgroup>
          <optgroup label={labels.roleGroup}>
            {Object.entries(BRANCH_ROLE_CANONICAL_LABELS).map(([code, label]) => (
              <option key={code} value={`role:${code}`}>
                {labels.branchRoles[code] ?? label}
              </option>
            ))}
          </optgroup>
        </Select>
      </div>

      <div>
        <label
          htmlFor="communication-channel"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          {labels.channel}
        </label>
        <Select
          id="communication-channel"
          name="channel"
          defaultValue={searchParams.get("channel") ?? "email"}
          onChange={submitForm}
        >
          <option value="email">{labels.channelEmail}</option>
          <option value="sms">{labels.channelSms}</option>
        </Select>
      </div>

      <HouseholdSearchField
        defaultHouseholdId={searchParams.get("householdId") ?? ""}
        defaultHouseholdName={searchParams.get("householdName") ?? ""}
        labels={{
          label: labels.household,
          placeholder: labels.householdPlaceholder,
          clear: labels.householdClear,
          loading: labels.householdLoading,
          noResults: labels.householdNoResults,
        }}
        onChange={submitForm}
      />
    </form>
  );
}
