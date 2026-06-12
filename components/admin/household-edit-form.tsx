"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  adminUpdateHousehold,
  adminUpsertHouseholdPersons,
} from "@/app/actions/admin";
import { HouseholdStep } from "@/components/registration/household-step";
import { MembersStep } from "@/components/registration/members-step";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimestampMeta } from "@/components/shared/timestamp-meta";
import {
  householdToFormValues,
  personsToHouseholdPersonsFormValues,
} from "@/lib/registration/mappers";
import {
  buildPersonTimestampsMap,
  householdToTimestamps,
  type HouseholdTimestamps,
  type PersonTimestampsMap,
} from "@/lib/registration/person-timestamps";
import type {
  HouseholdFormValues,
  HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

type HouseholdEditFormProps = {
  householdId: string;
  householdDefaults: HouseholdFormValues;
  membersDefaults: HouseholdPersonsFormValues;
  householdTimestamps: HouseholdTimestamps;
  personTimestamps: PersonTimestampsMap;
};

type BannerMessage = {
  variant: "error" | "success";
  text: string;
};

export function HouseholdEditForm({
  householdId,
  householdDefaults: initialHouseholdDefaults,
  membersDefaults: initialMembersDefaults,
  householdTimestamps: initialHouseholdTimestamps,
  personTimestamps: initialPersonTimestamps,
}: HouseholdEditFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.household.edit");
  const tHousehold = useTranslations("admin.household");
  const tWizard = useTranslations("wizard.buttons");

  const [householdDefaults, setHouseholdDefaults] = useState(
    initialHouseholdDefaults,
  );
  const [membersDefaults, setMembersDefaults] = useState(initialMembersDefaults);
  const [householdTimestamps, setHouseholdTimestamps] = useState(
    initialHouseholdTimestamps,
  );
  const [personTimestamps, setPersonTimestamps] = useState(
    initialPersonTimestamps,
  );
  const [householdBanner, setHouseholdBanner] = useState<BannerMessage | null>(
    null,
  );
  const [membersBanner, setMembersBanner] = useState<BannerMessage | null>(
    null,
  );
  const [isSavingHousehold, setIsSavingHousehold] = useState(false);
  const [isSavingMembers, setIsSavingMembers] = useState(false);

  function goToDetail() {
    router.push(`/admin/households/${householdId}`);
  }

  async function handleHouseholdSubmit(values: HouseholdFormValues) {
    setHouseholdBanner(null);
    setIsSavingHousehold(true);

    const result = await adminUpdateHousehold(householdId, {
      locale: "fr",
      ...values,
    });

    setIsSavingHousehold(false);

    if (result.error || !result.data) {
      setHouseholdBanner({
        variant: "error",
        text: result.error ?? t("error"),
      });
      return;
    }

    setHouseholdDefaults(householdToFormValues(result.data));
    setHouseholdTimestamps(householdToTimestamps(result.data));
    setHouseholdBanner({ variant: "success", text: t("householdSaved") });
  }

  async function handleMembersSubmit(values: HouseholdPersonsFormValues) {
    setMembersBanner(null);
    setIsSavingMembers(true);

    const result = await adminUpsertHouseholdPersons(householdId, {
      locale: "fr",
      ...values,
    });

    setIsSavingMembers(false);

    if (result.error || !result.data) {
      setMembersBanner({
        variant: "error",
        text: result.error ?? t("error"),
      });
      return;
    }

    setMembersDefaults(
      personsToHouseholdPersonsFormValues(result.data.persons),
    );
    setPersonTimestamps(buildPersonTimestampsMap(result.data.persons));
    setHouseholdTimestamps(householdToTimestamps(result.data.household));
    setMembersBanner({ variant: "success", text: t("membersSaved") });
  }

  return (
    <div className="space-y-8">
      <TimestampMeta
        createdAt={householdTimestamps.createdAt}
        updatedAt={householdTimestamps.updatedAt}
        labels={{
          created: tHousehold("createdAt"),
          updated: tHousehold("updatedAt"),
        }}
        inline
      />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            {t("householdSection")}
          </h2>
        </CardHeader>
        <CardContent>
          {householdBanner ? (
            <Alert variant={householdBanner.variant} className="mb-4">
              {householdBanner.text}
            </Alert>
          ) : null}
          <HouseholdStep
            defaultValues={householdDefaults}
            onSubmit={handleHouseholdSubmit}
            onBack={goToDetail}
            isSubmitting={isSavingHousehold}
            submitLabel={t("saveHousehold")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            {t("membersSection")}
          </h2>
        </CardHeader>
        <CardContent>
          {membersBanner ? (
            <Alert variant={membersBanner.variant} className="mb-4">
              {membersBanner.text}
            </Alert>
          ) : null}
          <MembersStep
            defaultValues={membersDefaults}
            isEditMode
            submitLabel={t("saveMembers")}
            onSubmit={handleMembersSubmit}
            onBack={goToDetail}
            isSubmitting={isSavingMembers}
            personTimestamps={personTimestamps}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted">
        {tWizard("back")} :{" "}
        <button
          type="button"
          onClick={goToDetail}
          className="font-medium text-primary hover:text-primary-hover"
        >
          {t("backToDetail")}
        </button>
      </p>
    </div>
  );
}
