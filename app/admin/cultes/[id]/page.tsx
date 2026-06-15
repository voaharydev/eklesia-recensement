import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getServiceDetail } from "@/app/actions/scheduling";
import { CulteAssignmentsTable } from "@/components/admin/culte-assignments-table";
import { CulteServiceActions } from "@/components/admin/culte-service-actions";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import { formatDateShort } from "@/lib/format/datetime";
import type { ServiceAssignmentStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type AdminCulteDetailPageProps = {
  params: { id: string };
};

export default async function AdminCulteDetailPage({
  params,
}: AdminCulteDetailPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.cultes" });
  const result = await getServiceDetail({ serviceId: params.id });

  if (result.error) {
    return (
      <div className="space-y-6">
        <Alert variant="error">{result.error}</Alert>
        <Link href="/admin/cultes" className="text-sm font-medium text-primary">
          ← {t("backToList")}
        </Link>
      </div>
    );
  }

  const detail = result.data;
  if (!detail) {
    notFound();
  }

  const statuses: Record<ServiceAssignmentStatus, string> = {
    draft: t("status.draft"),
    pending: t("status.pending"),
    accepted: t("status.accepted"),
    declined: t("status.declined"),
  };

  const today = new Date().toISOString().slice(0, 10);
  const allDraft = detail.assignments.every(
    (assignment) => assignment.status === "draft",
  );
  const canRecalculate =
    allDraft && detail.service_date >= today && !detail.cancelled_at;
  const isCancelled = Boolean(detail.cancelled_at);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/admin/cultes" className="font-medium text-primary hover:underline">
            ← {t("backToList")}
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {formatDateShort(detail.service_date)} — {detail.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("detailDescription")}</p>
      </div>

      <CulteServiceActions
        serviceId={detail.id}
        isCancelled={isCancelled}
        labels={{
          cancelService: t("cancelService"),
          reactivateService: t("reactivateService"),
          deleteService: t("deleteService"),
          cancelling: t("cancelling"),
          reactivating: t("reactivating"),
          deleting: t("deleting"),
          cancelConfirm: t("cancelConfirm"),
          deleteConfirm: t("deleteConfirm"),
          cancelledBanner: t("cancelledBanner"),
        }}
      />

      <CulteAssignmentsTable
        detail={detail}
        canRecalculate={canRecalculate}
        isCancelled={isCancelled}
        labels={{
          person: t("columns.person"),
          role: t("columns.role"),
          status: t("columns.status"),
          declineReason: t("declineReason"),
          sendInvitations: t("sendInvitations"),
          sending: t("sending"),
          recalculateService: t("recalculateService"),
          recalculatingService: t("recalculatingService"),
          recalculateServiceConfirm: t("recalculateServiceConfirm"),
          recalculateServiceSuccess: t("recalculateServiceSuccess"),
          replace: t("replace"),
          replacing: t("replacing"),
          selectVolunteer: t("selectVolunteer"),
          noVolunteers: t("noVolunteers"),
          roles: {
            powerpoint: t("roles.powerpoint"),
            priere: t("roles.priere"),
            lecture1: t("roles.lecture1"),
            lecture2: t("roles.lecture2"),
            lecture3: t("roles.lecture3"),
          },
          statuses,
        }}
      />
    </div>
  );
}
