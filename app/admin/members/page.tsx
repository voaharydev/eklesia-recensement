import { getTranslations } from "next-intl/server";

import { getExportScopeCounts, getPaginatedMembers } from "@/app/actions/admin";
import { MembersDataGrid } from "@/components/admin/members-data-grid";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import {
  parseMembersSearchParams,
  type MembersSearchParams,
} from "@/lib/admin/parse-members-search-params";

export const dynamic = "force-dynamic";

type AdminMembersPageProps = {
  searchParams: MembersSearchParams;
};

export default async function AdminMembersPage({
  searchParams,
}: AdminMembersPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.members" });
  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });

  const filters = parseMembersSearchParams(searchParams);
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const [result, exportCountsResult] = await Promise.all([
    getPaginatedMembers(filters, page),
    getExportScopeCounts(filters),
  ]);

  const exportCounts = exportCountsResult.data ?? {
    householdCount: 0,
    memberCount: 0,
  };

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
    exportExcel: t("export.excel", {
      households: exportCounts.householdCount,
      members: exportCounts.memberCount,
    }),
    exportCsv: t("export.csv", {
      households: exportCounts.householdCount,
      members: exportCounts.memberCount,
    }),
    exportHint: t("export.hint"),
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
      exportMemberCount={exportCounts.memberCount}
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
