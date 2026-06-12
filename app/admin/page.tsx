import { getTranslations } from "next-intl/server";

import { getDashboardMetrics } from "@/app/actions/admin";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import { BranchDistribution } from "@/components/admin/branch-distribution";
import { DashboardKpiGrid } from "@/components/admin/dashboard-kpi-grid";
import { Alert } from "@/components/ui/alert";

export default async function AdminDashboardPage() {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.dashboard" });
  const result = await getDashboardMetrics();

  if (result.error || !result.data) {
    return <Alert variant="error">{result.error ?? t("loadError")}</Alert>;
  }

  const kpiLabels = {
    activeHouseholds: t("activeHouseholds"),
    totalMembers: t("totalMembers"),
    adultCount: t("adultCount"),
    childCount: t("childCount"),
    baptizedCount: t("baptizedCount"),
    mpandrayCount: t("mpandrayCount"),
    mpiandryCount: t("mpiandryCount"),
    mpamakyTenyCount: t("mpamakyTenyCount"),
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <DashboardKpiGrid metrics={result.data} labels={kpiLabels} />

      <BranchDistribution
        branchCounts={result.data.branchCounts}
        title={t("branchDistribution")}
        emptyLabel={t("noBranches")}
      />
    </div>
  );
}
