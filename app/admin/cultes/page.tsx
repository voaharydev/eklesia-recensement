import Link from "next/link";

import { getUpcomingServices } from "@/app/actions/scheduling";
import { CultesDataGrid } from "@/components/admin/cultes-data-grid";
import { GenerateScheduleButton } from "@/components/admin/generate-schedule-button";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function AdminCultesPage() {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.cultes" });
  const currentYear = new Date().getFullYear();
  const result = await getUpcomingServices();

  const gridLabels = {
    date: t("columns.date"),
    title: t("columns.title"),
    draft: t("status.draft"),
    pending: t("status.pending"),
    accepted: t("status.accepted"),
    declined: t("status.declined"),
    view: t("viewDetail"),
    empty: t("empty"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("description")}</p>
        </div>
        <GenerateScheduleButton
          year={currentYear}
          labels={{
            generate: t("generateYear", { year: currentYear }),
            generating: t("generating"),
            success: t("generateSuccess"),
          }}
        />
      </div>

      {result.error ? (
        <Alert variant="error">{result.error}</Alert>
      ) : (
        <CultesDataGrid services={result.data ?? []} labels={gridLabels} />
      )}

      <p className="text-sm text-muted">
        <Link href="/admin" className="font-medium text-primary hover:underline">
          ← {t("backToDashboard")}
        </Link>
      </p>
    </div>
  );
}
