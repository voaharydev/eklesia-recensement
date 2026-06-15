"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type CultesFiltersProps = {
  labels: {
    search: string;
    searchPlaceholder: string;
    dateFrom: string;
    dateTo: string;
    progress: string;
    progressAll: string;
    progressDraft: string;
    progressPending: string;
    progressDeclined: string;
    sort: string;
    sortDateAsc: string;
    sortDateDesc: string;
    sortTitleAsc: string;
    sortTitleDesc: string;
    showCancelled: string;
  };
};

export function CultesFilters({ labels }: CultesFiltersProps) {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const formKey = searchParams.toString();

  return (
    <form
      ref={formRef}
      key={formKey}
      action="/admin/cultes"
      method="get"
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <label
            htmlFor="cultes-search"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.search}
          </label>
          <Input
            id="cultes-search"
            name="search"
            type="search"
            placeholder={labels.searchPlaceholder}
            defaultValue={searchParams.get("search") ?? ""}
            onChange={onSearchChange}
          />
        </div>

        <div>
          <label
            htmlFor="cultes-date-from"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.dateFrom}
          </label>
          <Input
            id="cultes-date-from"
            name="dateFrom"
            type="date"
            defaultValue={searchParams.get("dateFrom") ?? ""}
            onChange={submitForm}
          />
        </div>

        <div>
          <label
            htmlFor="cultes-date-to"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.dateTo}
          </label>
          <Input
            id="cultes-date-to"
            name="dateTo"
            type="date"
            defaultValue={searchParams.get("dateTo") ?? ""}
            onChange={submitForm}
          />
        </div>

        <div>
          <label
            htmlFor="cultes-progress"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.progress}
          </label>
          <Select
            id="cultes-progress"
            name="progress"
            defaultValue={searchParams.get("progress") ?? ""}
            onChange={submitForm}
          >
            <option value="">{labels.progressAll}</option>
            <option value="draft">{labels.progressDraft}</option>
            <option value="pending">{labels.progressPending}</option>
            <option value="declined">{labels.progressDeclined}</option>
          </Select>
        </div>

        <div>
          <label
            htmlFor="cultes-sort"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            {labels.sort}
          </label>
          <Select
            id="cultes-sort"
            name="sort"
            defaultValue={searchParams.get("sort") ?? "date_asc"}
            onChange={submitForm}
          >
            <option value="date_asc">{labels.sortDateAsc}</option>
            <option value="date_desc">{labels.sortDateDesc}</option>
            <option value="title_asc">{labels.sortTitleAsc}</option>
            <option value="title_desc">{labels.sortTitleDesc}</option>
          </Select>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted hover:text-foreground">
        <Checkbox
          name="showCancelled"
          value="1"
          defaultChecked={searchParams.get("showCancelled") === "1"}
          onChange={submitForm}
        />
        <span>{labels.showCancelled}</span>
      </label>
    </form>
  );
}
