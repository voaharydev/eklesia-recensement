import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getPotentialDuplicates } from "@/app/actions/deduplication";
import { DuplicatesDashboard } from "@/components/admin/duplicates-dashboard";
import type { DuplicateGroupCardLabels } from "@/components/admin/duplicate-group-card";
import { Alert } from "@/components/ui/alert";
import { requireAdminPage } from "@/lib/admin/auth-guard";

export const dynamic = "force-dynamic";

type AdminDoublonsPageProps = {
  searchParams: { page?: string };
};

export default async function AdminDoublonsPage({
  searchParams,
}: AdminDoublonsPageProps) {
  await requireAdminPage();

  const t = await getTranslations({ locale: "fr", namespace: "admin.doublons" });
  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });
  const tSpiritual = await getTranslations({
    locale: "fr",
    namespace: "admin.members.spiritual",
  });

  const result = await getPotentialDuplicates();
  const groups = result.data ?? [];
  const totalPages = Math.max(1, groups.length);
  const requestedPage = Math.max(
    1,
    Number.parseInt(searchParams.page ?? "1", 10) || 1,
  );

  if (groups.length > 0 && requestedPage > totalPages) {
    redirect(`/admin/doublons?page=${totalPages}`);
  }

  const page = groups.length > 0 ? requestedPage : 1;
  const currentGroup = groups[page - 1];

  const cardLabels: DuplicateGroupCardLabels = {
    groupTitle: t("groupTitle"),
    matchEmail: t("matchEmail"),
    matchName: t("matchName"),
    matchPhone: t("matchPhone"),
    keepAsMaster: t("keepAsMaster"),
    masterBadge: t("masterBadge"),
    multiMergeHint: t("multiMergeHint"),
    selectDuplicate: t("selectDuplicate"),
    mergeEditor: {
      title: t("mergeEditorTitle"),
      confirmMerge: t("confirmMerge"),
      merging: t("merging"),
      mergeConfirm: t("mergeConfirm"),
      mergeSuccess: t("mergeSuccess"),
      useMasterValue: t("useMasterValue"),
      useDuplicateValue: t("useDuplicateValue"),
      masterRoleBranch: t("masterRoleBranch"),
      duplicateRoleBranch: t("duplicateRoleBranch"),
      includeBranch: t("includeBranch"),
      assignmentsTransferred: t("assignmentsTransferred"),
      householdKept: t("householdKept"),
      fields: {
        firstName: t("editorFields.firstName"),
        lastName: t("editorFields.lastName"),
        email: t("editorFields.email"),
        phone: t("editorFields.phone"),
        role: t("editorFields.role"),
        age: t("editorFields.age"),
        branches: t("editorFields.branches"),
        spiritual: t("editorFields.spiritual"),
      },
      spiritual: {
        baptized: tSpiritual("baptized"),
        mpandray: tSpiritual("mpandray"),
        mpiandry: tSpiritual("mpiandry"),
        mpamakyTeny: tSpiritual("mpamakyTeny"),
      },
      roleLabels: {
        chef_de_famille: tRoles("chef_de_famille"),
        conjoint: tRoles("conjoint"),
        autre: tRoles("autre"),
        enfant: tRoles("enfant"),
      },
    },
    fields: {
      name: t("fields.name"),
      email: t("fields.email"),
      phone: t("fields.phone"),
      household: t("fields.household"),
      role: t("fields.role"),
      age: t("fields.age"),
      branches: t("fields.branches"),
      spiritual: t("fields.spiritual"),
      assignments: t("fields.assignments"),
      createdAt: t("fields.createdAt"),
      updatedAt: t("fields.updatedAt"),
    },
    spiritual: {
      baptized: tSpiritual("baptized"),
      mpandray: tSpiritual("mpandray"),
      mpiandry: tSpiritual("mpiandry"),
      mpamakyTeny: tSpiritual("mpamakyTeny"),
    },
    roleLabels: {
      chef_de_famille: tRoles("chef_de_famille"),
      conjoint: tRoles("conjoint"),
      autre: tRoles("autre"),
      enfant: tRoles("enfant"),
    },
  };

  const paginationLabels = {
    pageInfo: t("pagination.pageInfo", { page, total: totalPages }),
    previous: t("pagination.previous"),
    next: t("pagination.next"),
  };

  const groupProgress = currentGroup
    ? t("groupProgress", { page, total: totalPages })
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </div>

      <Alert variant="error">{t("irreversibleWarning")}</Alert>

      {result.error ? (
        <Alert variant="error">{result.error}</Alert>
      ) : null}

      {!result.error && groups.length === 0 ? (
        <Alert variant="info">{t("empty")}</Alert>
      ) : null}

      {currentGroup ? (
        <DuplicatesDashboard
          group={currentGroup}
          page={page}
          totalPages={totalPages}
          groupProgress={groupProgress ?? ""}
          labels={cardLabels}
          paginationLabels={paginationLabels}
        />
      ) : null}
    </div>
  );
}
