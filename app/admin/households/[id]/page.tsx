import Link from "next/link";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import {
  getGroupedHouseholdMembers,
  getHouseholdById,
} from "@/app/actions/admin";
import { HouseholdMemberList } from "@/components/admin/household-member-list";
import { UnregisterHouseholdButton } from "@/components/admin/unregister-household-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin/auth-guard";

type AdminHouseholdPageProps = {
  params: { id: string };
};

export default async function AdminHouseholdPage({
  params,
}: AdminHouseholdPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.household" });
  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });

  const tBranches = await getTranslations({ locale: "fr", namespace: "form.branches" });

  const householdResult = await getHouseholdById(params.id);
  if (householdResult.error || !householdResult.data) {
    notFound();
  }

  const groupsResult = await getGroupedHouseholdMembers(params.id);
  if (groupsResult.error || !groupsResult.data) {
    return (
      <Alert variant="error">
        {groupsResult.error ?? "Impossible de charger ce foyer."}
      </Alert>
    );
  }

  const { household } = householdResult.data;
  const isArchived = household.unregistered_at != null;

  const roleLabels = {
    chef_de_famille: tRoles("chef_de_famille"),
    conjoint: tRoles("conjoint"),
    autre: tRoles("autre"),
    enfant: tRoles("enfant"),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/members"
        className="text-sm font-medium text-primary hover:text-primary-hover"
      >
        {t("backToMembers")}
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{household.name}</h1>
            <Badge variant={isArchived ? "warning" : "success"}>
              {isArchived ? t("statusArchived") : t("statusActive")}
            </Badge>
          </div>
        </div>

        {!isArchived ? (
          <UnregisterHouseholdButton
            householdId={household.id}
            labels={{
              button: t("unregister.button"),
              buttonLoading: t("unregister.buttonLoading"),
              title: t("unregister.title"),
              description: t("unregister.description"),
              confirm: t("unregister.confirm"),
              cancel: t("unregister.cancel"),
              error: t("unregister.error"),
            }}
          />
        ) : null}
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            {t("infoTitle")}
          </h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-700">{t("address")}</dt>
              <dd className="text-muted">{household.main_address}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">{t("phone")}</dt>
              <dd className="text-muted">{household.landline_phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">{t("arrivalFjkm")}</dt>
              <dd className="text-muted">
                {household.arrival_date_fjkm ?? "—"}
              </dd>
            </div>
            {isArchived ? (
              <div>
                <dt className="font-medium text-gray-700">{t("unregisteredAt")}</dt>
                <dd className="text-muted">
                  {new Date(household.unregistered_at!).toLocaleDateString("fr-CA")}
                </dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          {t("membersTitle")}
        </h2>
        <HouseholdMemberList
          grouped={groupsResult.data}
          roleLabels={roleLabels}
          labels={{
            head: t("groups.head"),
            spouse: t("groups.spouse"),
            otherAdults: t("groups.otherAdults"),
            children: t("groups.children"),
            noMembers: t("membersEmpty"),
            email: t("email"),
            phone: t("phone"),
            age: t("age"),
            branches: tBranches("title"),
            spiritualLabels: {
              baptized: t("spiritual.baptized"),
              mpandray: t("spiritual.mpandray"),
              mpiandry: t("spiritual.mpiandry"),
              mpamakyTeny: t("spiritual.mpamakyTeny"),
            },
          }}
        />
      </section>
    </div>
  );
}
