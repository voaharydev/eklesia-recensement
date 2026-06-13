import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { getMemberAssignments } from "@/app/actions/scheduling";
import { MemberPlanningTimeline } from "@/components/scheduling/member-planning-timeline";
import { SignOutButton } from "@/components/scheduling/sign-out-button";
import { Alert } from "@/components/ui/alert";
import { getAuthenticatedPerson } from "@/lib/scheduling/member-auth";
import type { Locale } from "@/i18n/routing";
import type { ServiceAssignmentStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type MonPlanningPageProps = {
  params: { locale: Locale };
};

export default async function MonPlanningPage({
  params: { locale },
}: MonPlanningPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "scheduling.planning" });
  const person = await getAuthenticatedPerson();
  const result = await getMemberAssignments();

  const statuses: Record<ServiceAssignmentStatus, string> = {
    draft: t("status.draft"),
    pending: t("status.pending"),
    accepted: t("status.accepted"),
    declined: t("status.declined"),
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            {person ? (
              <p className="mt-2 text-sm text-muted">
                {t("greeting", {
                  name: `${person.first_name} ${person.last_name}`.trim(),
                })}
              </p>
            ) : null}
          </div>
          <SignOutButton locale={locale} label={t("signOut")} />
        </div>

        {result.error ? (
          <Alert variant="error">{result.error}</Alert>
        ) : (
          <MemberPlanningTimeline
            assignments={result.data ?? []}
            labels={{
              empty: t("empty"),
              accept: t("accept"),
              decline: t("decline"),
              accepting: t("accepting"),
              declining: t("declining"),
              declineTitle: t("declineTitle"),
              declineDescription: t("declineDescription"),
              declineReasonLabel: t("declineReasonLabel"),
              declineConfirm: t("declineConfirm"),
              cancel: t("cancel"),
              error: t("error"),
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
        )}
      </main>
    </div>
  );
}
