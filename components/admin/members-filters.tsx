"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BRANCH_OPTIONS } from "@/lib/constants/branches";
import { FORM_HOUSEHOLD_ROLES } from "@/lib/constants/person-roles";

type MembersFiltersProps = {
  labels: {
    search: string;
    searchPlaceholder: string;
    ageGroup: string;
    ageAll: string;
    ageAdult: string;
    ageChild: string;
    status: string;
    statusAll: string;
    statusActive: string;
    statusArchived: string;
    role: string;
    roleAll: string;
    branch: string;
    branchAll: string;
    updated: string;
    updatedAll: string;
    updated7d: string;
    updated30d: string;
    updated90d: string;
    updatedNever: string;
    updatedFrom: string;
    updatedTo: string;
    roleLabels: Record<string, string>;
  };
};

export function MembersFilters({ labels }: MembersFiltersProps) {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetRef = useRef<HTMLSelectElement>(null);
  const updatedFromRef = useRef<HTMLInputElement>(null);
  const updatedToRef = useRef<HTMLInputElement>(null);

  const submitForm = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const onSearchChange = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      submitForm();
    }, 400);
  }, [submitForm]);

  const onPresetChange = useCallback(() => {
    if (updatedFromRef.current) updatedFromRef.current.value = "";
    if (updatedToRef.current) updatedToRef.current.value = "";
    submitForm();
  }, [submitForm]);

  const onDateChange = useCallback(() => {
    if (presetRef.current) presetRef.current.value = "";
    submitForm();
  }, [submitForm]);

  const formKey = searchParams.toString();

  return (
    <form
      ref={formRef}
      key={formKey}
      action="/admin/members"
      method="get"
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label
            htmlFor="members-search"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.search}
          </label>
          <Input
            id="members-search"
            name="search"
            type="search"
            placeholder={labels.searchPlaceholder}
            defaultValue={searchParams.get("search") ?? ""}
            onChange={onSearchChange}
          />
        </div>

        <div>
          <label
            htmlFor="members-is-child"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.ageGroup}
          </label>
          <Select
            id="members-is-child"
            name="is_child"
            defaultValue={searchParams.get("is_child") ?? ""}
            onChange={submitForm}
          >
            <option value="">{labels.ageAll}</option>
            <option value="false">{labels.ageAdult}</option>
            <option value="true">{labels.ageChild}</option>
          </Select>
        </div>

        <div>
          <label
            htmlFor="members-status"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.status}
          </label>
          <Select
            id="members-status"
            name="status"
            defaultValue={searchParams.get("status") ?? ""}
            onChange={submitForm}
          >
            <option value="">{labels.statusAll}</option>
            <option value="active">{labels.statusActive}</option>
            <option value="archived">{labels.statusArchived}</option>
          </Select>
        </div>

        <div>
          <label
            htmlFor="members-role"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.role}
          </label>
          <Select
            id="members-role"
            name="role"
            defaultValue={searchParams.get("role") ?? ""}
            onChange={submitForm}
          >
            <option value="">{labels.roleAll}</option>
            {FORM_HOUSEHOLD_ROLES.map((role) => (
              <option key={role} value={role}>
                {labels.roleLabels[role] ?? role}
              </option>
            ))}
          </Select>
        </div>

        <div className="sm:col-span-2 lg:col-span-1">
          <label
            htmlFor="members-branch"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.branch}
          </label>
          <Select
            id="members-branch"
            name="branch_code"
            defaultValue={searchParams.get("branch_code") ?? ""}
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            htmlFor="members-updated-preset"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.updated}
          </label>
          <Select
            ref={presetRef}
            id="members-updated-preset"
            name="updated_preset"
            defaultValue={searchParams.get("updated_preset") ?? ""}
            onChange={onPresetChange}
          >
            <option value="">{labels.updatedAll}</option>
            <option value="7d">{labels.updated7d}</option>
            <option value="30d">{labels.updated30d}</option>
            <option value="90d">{labels.updated90d}</option>
            <option value="never">{labels.updatedNever}</option>
          </Select>
        </div>

        <div>
          <label
            htmlFor="members-updated-from"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.updatedFrom}
          </label>
          <Input
            ref={updatedFromRef}
            id="members-updated-from"
            name="updated_from"
            type="date"
            defaultValue={searchParams.get("updated_from") ?? ""}
            onChange={onDateChange}
          />
        </div>

        <div>
          <label
            htmlFor="members-updated-to"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.updatedTo}
          </label>
          <Input
            ref={updatedToRef}
            id="members-updated-to"
            name="updated_to"
            type="date"
            defaultValue={searchParams.get("updated_to") ?? ""}
            onChange={onDateChange}
          />
        </div>
      </div>
    </form>
  );
}
