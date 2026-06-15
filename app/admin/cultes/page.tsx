import Link from "next/link";
import { Suspense } from "react";

import { getUpcomingServices } from "@/app/actions/scheduling";
import { CultesDataGrid } from "@/components/admin/cultes-data-grid";
import { CultesFilters } from "@/components/admin/cultes-filters";
import { GenerateScheduleButton } from "@/components/admin/generate-schedule-button";
import { ManageCultesDatesForm } from "@/components/admin/manage-cultes-dates-form";
import { RecalculateDraftScheduleButton } from "@/components/admin/recalculate-draft-schedule-button";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import {
  cultesFiltersToSearchParams,
  hasActiveCultesFilters,
  parseCultesSearchParams,
  type CultesSearchParams,
} from "@/lib/scheduling/parse-cultes-search-params";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type AdminCultesPageProps = {
  searchParams: CultesSearchParams;
};

export default async function AdminCultesPage({
  searchParams,
}: AdminCultesPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.cultes" });
  const currentYear = new Date().getFullYear();
  const filters = parseCultesSearchParams(searchParams);
  const result = await getUpcomingServices(filters);

  const filterLabels = {
    search: t("filters.search"),
    searchPlaceholder: t("filters.searchPlaceholder"),
    dateFrom: t("filters.dateFrom"),
    dateTo: t("filters.dateTo"),
    progress: t("filters.progress"),
    progressAll: t("filters.progressAll"),
    progressDraft: t("filters.progressDraft"),
    progressPending: t("filters.progressPending"),
    progressDeclined: t("filters.progressDeclined"),
    sort: t("filters.sort"),
    sortDateAsc: t("filters.sortDateAsc"),
    sortDateDesc: t("filters.sortDateDesc"),
    sortTitleAsc: t("filters.sortTitleAsc"),
    sortTitleDesc: t("filters.sortTitleDesc"),
    showCancelled: t("filters.showCancelled"),
  };

  const gridLabels = {
    date: t("columns.date"),
    title: t("columns.title"),
    draft: t("status.draft"),
    pending: t("status.pending"),
    accepted: t("status.accepted"),
    declined: t("status.declined"),
    cancelled: t("cancelled"),
    view: t("viewDetail"),
    empty: t("empty"),
    emptyFiltered: t("emptyFiltered"),
    resultCount: t("filters.resultCount"),
  };

  const manageDatesLabels = {
    title: t("manageDatesTitle"),
    singleTitle: t("addDateSingleTitle"),
    rangeTitle: t("addDateRangeTitle"),
    serviceDate: t("columns.date"),
    dateFrom: t("dateFrom"),
    dateTo: t("dateTo"),
    titleOptional: t("titleOptional"),
    addDate: t("addDate"),
    addDateRange: t("addDateRange"),
    adding: t("addingDate"),
    addDateSuccess: t("addDateSuccess"),
    addRangeSuccess: t("addRangeSuccess"),
    rangeConfirm: t("rangeConfirm"),
    error: t("addDateError"),
  };

  const gridSearchParams = cultesFiltersToSearchParams(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
          <p className="mt-2 text-xs text-muted">{t("eligibilityHint")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <GenerateScheduleButton
            year={currentYear}
            labels={{
              generate: t("generateYear", { year: currentYear }),
              generating: t("generating"),
              success: t("generateSuccess"),
            }}
          />
          <RecalculateDraftScheduleButton
            labels={{
              recalculate: t("recalculateDraft"),
              recalculating: t("recalculating"),
              confirm: t("recalculateConfirm"),
              success: t("recalculateSuccess"),
            }}
          />
        </div>
      </div>

      <ManageCultesDatesForm labels={manageDatesLabels} className="mt-2" />

      <Suspense fallback={null}>
        <CultesFilters labels={filterLabels} />
      </Suspense>

      {result.error ? (
        <Alert variant="error">{result.error}</Alert>
      ) : (
        <CultesDataGrid
          services={result.data ?? []}
          hasActiveFilters={hasActiveCultesFilters(filters)}
          searchParams={gridSearchParams}
          labels={gridLabels}
        />
      )}

      <p className="text-sm text-muted">
        <Link href="/admin" className="font-medium text-primary hover:underline">
          ← {t("backToDashboard")}
        </Link>
      </p>
    </div>
  );
}
