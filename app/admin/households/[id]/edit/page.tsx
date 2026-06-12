import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

import { getHouseholdMembers } from "@/app/actions/admin";
import { HouseholdEditForm } from "@/components/admin/household-edit-form";
import { requireAdminPage } from "@/lib/admin/auth-guard";
import {
  householdToFormValues,
  personsToHouseholdPersonsFormValues,
} from "@/lib/registration/mappers";
import {
  buildPersonTimestampsMap,
  householdToTimestamps,
} from "@/lib/registration/person-timestamps";

type AdminHouseholdEditPageProps = {
  params: { id: string };
};

export default async function AdminHouseholdEditPage({
  params,
}: AdminHouseholdEditPageProps) {
  await requireAdminPage();
  const t = await getTranslations({ locale: "fr", namespace: "admin.household" });

  const result = await getHouseholdMembers(params.id);
  if (result.error || !result.data) {
    notFound();
  }

  const { household, members } = result.data;

  if (household.unregistered_at) {
    redirect(`/admin/households/${params.id}`);
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/households/${params.id}`}
        className="text-sm font-medium text-primary hover:text-primary-hover"
      >
        ← {t("edit.backToDetail")}
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("edit.title", { name: household.name })}
        </h1>
      </header>

      <HouseholdEditForm
        householdId={household.id}
        householdDefaults={householdToFormValues(household)}
        membersDefaults={personsToHouseholdPersonsFormValues(members)}
        householdTimestamps={householdToTimestamps(household)}
        personTimestamps={buildPersonTimestampsMap(members)}
      />
    </div>
  );
}
