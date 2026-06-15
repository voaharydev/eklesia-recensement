import { getTranslations } from "next-intl/server";

import { getDashboardMetrics } from "@/app/actions/admin";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import { BranchDistribution } from "@/components/admin/branch-distribution";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
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
    sefalaCount: t("sefalaCount"),
    mpamakyTenyCount: t("mpamakyTenyCount"),
  };

  const chartLabels = {
    activityTitle: t("charts.activityTitle"),
    archivesTitle: t("charts.archivesTitle"),
    stockTitle: t("charts.stockTitle"),
    spiritualTitle: t("charts.spiritualTitle"),
    householdsCreated: t("charts.householdsCreated"),
    membersCreated: t("charts.membersCreated"),
    householdsUpdated: t("charts.householdsUpdated"),
    householdsArchived: t("charts.householdsArchived"),
    activeHouseholds: t("charts.activeHouseholds"),
    activeMembers: t("charts.activeMembers"),
    spiritual: {
      baptized: t("charts.spiritual.baptized"),
      mpiandry: t("charts.spiritual.mpiandry"),
      mpandray: t("charts.spiritual.mpandray"),
      sefala: t("charts.spiritual.sefala"),
      mpamakyTeny: t("charts.spiritual.mpamakyTeny"),
    },
    noData: t("charts.noData"),
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </header>

      <DashboardKpiGrid metrics={result.data} labels={kpiLabels} />

      <DashboardCharts
        monthly={result.data.monthly}
        spiritualCounts={result.data.spiritualCounts}
        labels={chartLabels}
      />

      <BranchDistribution
        branchCounts={result.data.branchCounts}
        title={t("branchDistribution")}
        emptyLabel={t("noBranches")}
      />
    </div>
  );
}
