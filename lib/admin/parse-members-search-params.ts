import type { MembersFilters } from "@/lib/admin/types";
import { parseUpdatedPreset } from "@/lib/admin/updated-filter";

export type MembersSearchParams = {
  search?: string;
  role?: string;
  is_child?: string;
  branch_code?: string;
  status?: string;
  updated_preset?: string;
  updated_from?: string;
  updated_to?: string;
  page?: string;
  format?: string;
};

export function parseMembersSearchParams(
  searchParams: MembersSearchParams,
): MembersFilters {
  const filters: MembersFilters = {};

  if (searchParams.search?.trim()) {
    filters.search = searchParams.search.trim();
  }
  if (searchParams.role) {
    filters.role = searchParams.role;
  }
  if (searchParams.is_child === "true") {
    filters.is_child = true;
  } else if (searchParams.is_child === "false") {
    filters.is_child = false;
  }
  if (searchParams.branch_code) {
    filters.branch_code = searchParams.branch_code;
  }
  if (searchParams.status === "active" || searchParams.status === "archived") {
    filters.status = searchParams.status;
  }

  const updatedPreset = parseUpdatedPreset(searchParams.updated_preset);
  if (updatedPreset) {
    filters.updated_preset = updatedPreset;
  }
  if (searchParams.updated_from?.trim()) {
    filters.updated_from = searchParams.updated_from.trim();
  }
  if (searchParams.updated_to?.trim()) {
    filters.updated_to = searchParams.updated_to.trim();
  }

  return filters;
}
