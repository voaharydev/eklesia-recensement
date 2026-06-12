"use client";

import { useTranslations } from "next-intl";

import { TimestampMeta } from "@/components/shared/timestamp-meta";
import type { HouseholdTimestamps } from "@/lib/registration/person-timestamps";

type HouseholdTimestampsBannerProps = {
  timestamps: HouseholdTimestamps;
};

export function HouseholdTimestampsBanner({
  timestamps,
}: HouseholdTimestampsBannerProps) {
  const tForm = useTranslations("form.household");

  return (
    <div className="mb-4 rounded-lg border border-border bg-surface-muted/40 px-4 py-3">
      <TimestampMeta
        createdAt={timestamps.createdAt}
        updatedAt={timestamps.updatedAt}
        labels={{
          created: tForm("createdAt"),
          updated: tForm("updatedAt"),
        }}
        inline
      />
    </div>
  );
}
