import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { MembersFilters } from "@/components/admin/members-filters";
import { requireAdminPage } from "@/lib/admin/auth-guard";

type AdminMembersLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminMembersLayout({
  children,
}: AdminMembersLayoutProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.members" });
  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });

  const roleLabels = {
    chef_de_famille: tRoles("chef_de_famille"),
    conjoint: tRoles("conjoint"),
    autre: tRoles("autre"),
    enfant: tRoles("enfant"),
  };

  const filterLabels = {
    search: t("filters.search"),
    searchPlaceholder: t("filters.searchPlaceholder"),
    ageGroup: t("filters.ageGroup"),
    ageAll: t("filters.ageAll"),
    ageAdult: t("filters.adult"),
    ageChild: t("filters.child"),
    status: t("filters.status"),
    statusAll: t("filters.ageAll"),
    statusActive: t("filters.statusActive"),
    statusArchived: t("filters.statusArchived"),
    role: t("filters.role"),
    roleAll: t("filters.roleAll"),
    branch: t("filters.branch"),
    branchAll: t("filters.branchAll"),
    updated: t("filters.updated"),
    updatedAll: t("filters.updatedAll"),
    updated7d: t("filters.updated7d"),
    updated30d: t("filters.updated30d"),
    updated90d: t("filters.updated90d"),
    updatedNever: t("filters.updatedNever"),
    updatedFrom: t("filters.updatedFrom"),
    updatedTo: t("filters.updatedTo"),
    roleLabels,
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </header>

      <Suspense fallback={null}>
        <MembersFilters labels={filterLabels} />
      </Suspense>

      {children}
    </div>
  );
}
