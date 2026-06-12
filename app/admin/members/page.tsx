import { getTranslations } from "next-intl/server";

import { getPaginatedMembers } from "@/app/actions/admin";
import { MembersDataGrid } from "@/components/admin/members-data-grid";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import type { MembersFilters as MembersFiltersType } from "@/lib/admin/types";
import { parseUpdatedPreset } from "@/lib/admin/updated-filter";

export const dynamic = "force-dynamic";

type AdminMembersPageProps = {
  searchParams: {
    search?: string;
    role?: string;
    is_child?: string;
    branch_code?: string;
    status?: string;
    updated_preset?: string;
    updated_from?: string;
    updated_to?: string;
    page?: string;
  };
};

function parseFilters(
  searchParams: AdminMembersPageProps["searchParams"],
): MembersFiltersType {
  const filters: MembersFiltersType = {};

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

export default async function AdminMembersPage({
  searchParams,
}: AdminMembersPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.members" });
  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });

  const filters = parseFilters(searchParams);
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const result = await getPaginatedMembers(filters, page);

  const roleLabels = {
    chef_de_famille: tRoles("chef_de_famille"),
    conjoint: tRoles("conjoint"),
    autre: tRoles("autre"),
    enfant: tRoles("enfant"),
  };

  const totalPages = result.data
    ? Math.max(1, Math.ceil(result.data.total / result.data.pageSize))
    : 1;

  const gridLabels = {
    name: t("columns.name"),
    household: t("columns.household"),
    role: t("columns.role"),
    age: t("columns.age"),
    email: t("columns.email"),
    phone: t("columns.phone"),
    spiritual: t("columns.spiritual"),
    assignments: t("columns.assignments"),
    householdUpdated: t("columns.householdUpdated"),
    noResults: t("empty"),
    previous: t("pagination.previous"),
    next: t("pagination.next"),
    pageInfo: t("pagination.pageInfo", {
      page: result.data?.page ?? page,
      totalPages,
      total: result.data?.total ?? 0,
    }),
    roleLabels,
    spiritualLabels: {
      baptized: t("spiritual.baptized"),
      mpandray: t("spiritual.mpandray"),
      mpiandry: t("spiritual.mpiandry"),
      mpamakyTeny: t("spiritual.mpamakyTeny"),
    },
  };

  if (result.error || !result.data) {
    return <Alert variant="error">{result.error ?? t("loadError")}</Alert>;
  }

  return (
    <MembersDataGrid
      data={result.data}
      searchParams={{
        search: searchParams.search,
        role: searchParams.role,
        is_child: searchParams.is_child,
        branch_code: searchParams.branch_code,
        status: searchParams.status,
        updated_preset: searchParams.updated_preset,
        updated_from: searchParams.updated_from,
        updated_to: searchParams.updated_to,
      }}
      labels={gridLabels}
    />
  );
}
