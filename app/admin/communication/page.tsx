import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { getTargetedMembers } from "@/app/actions/communication";
import { CommunicationFilters } from "@/components/admin/communication-filters";
import { CommunicationResults } from "@/components/admin/communication-results";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import {
  parseCommunicationFilters,
  type CommunicationSearchParams,
} from "@/lib/communication/parse-communication-filters";

export const dynamic = "force-dynamic";

type AdminCommunicationPageProps = {
  searchParams: CommunicationSearchParams;
};

export default async function AdminCommunicationPage({
  searchParams,
}: AdminCommunicationPageProps) {
  await requireAdminPage();
  const t = await getTranslations({
    locale: "fr",
    namespace: "admin.communication",
  });

  const filters = parseCommunicationFilters(searchParams);
  const result = await getTargetedMembers(filters);

  const filterLabels = {
    filtersTitle: t("filters.title"),
    ageMin: t("filters.ageMin"),
    ageMax: t("filters.ageMax"),
    branch: t("filters.branch"),
    branchAll: t("filters.branchAll"),
    profile: t("filters.profile"),
    profileAll: t("filters.profileAll"),
    spiritualGroup: t("filters.spiritualGroup"),
    roleGroup: t("filters.roleGroup"),
    spiritual: {
      mpandray: t("filters.spiritual.mpandray"),
      mpiandry: t("filters.spiritual.mpiandry"),
      sefala: t("filters.spiritual.sefala"),
      baptized: t("filters.spiritual.baptized"),
      mpamaky_teny: t("filters.spiritual.mpamakyTeny"),
    },
    branchRoles: {
      powerpoint: t("filters.branchRoles.powerpoint"),
      sonorisation: t("filters.branchRoles.sonorisation"),
      responsable: t("filters.branchRoles.responsable"),
      membre_actif: t("filters.branchRoles.membreActif"),
    },
    channel: t("filters.channel"),
    channelEmail: t("filters.channelEmail"),
    channelSms: t("filters.channelSms"),
    household: t("filters.household"),
    householdPlaceholder: t("filters.householdPlaceholder"),
    householdClear: t("filters.householdClear"),
    householdLoading: t("filters.householdLoading"),
    householdNoResults: t("filters.householdNoResults"),
  };

  const resultsLabels = {
    resultsTitle: t("results.title"),
    resultCount: t("results.count"),
    empty: t("results.empty"),
    lastName: t("columns.lastName"),
    firstName: t("columns.firstName"),
    email: t("columns.email"),
    phone: t("columns.phone"),
    household: t("columns.household"),
    copyEmails: t("actions.copyEmails"),
    copyPhones: t("actions.copyPhones"),
    sendEmail: t("actions.sendEmail"),
    copySuccessEmails: t("actions.copySuccessEmails"),
    copySuccessPhones: t("actions.copySuccessPhones"),
    copyError: t("actions.copyError"),
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("description")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader>
            <p className="text-base font-semibold text-foreground">
              {t("filters.cardTitle")}
            </p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<p className="text-sm text-muted">{t("loading")}</p>}>
              <CommunicationFilters labels={filterLabels} />
            </Suspense>
          </CardContent>
        </Card>

        <div className="lg:col-span-8">
          {result.error ? (
            <Alert variant="error">{result.error}</Alert>
          ) : (
            <CommunicationResults
              members={result.data ?? []}
              channel={filters.channel ?? "email"}
              labels={resultsLabels}
            />
          )}
        </div>
      </div>
    </div>
  );
}
