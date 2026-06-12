"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type HouseholdSizePromptProps = {
  onApply: (hasSpouse: boolean, childCount: number) => void;
};

export function HouseholdSizePrompt({ onApply }: HouseholdSizePromptProps) {
  const t = useTranslations("wizard.householdSize");
  const tSections = useTranslations("wizard.sections");
  const [withSpouse, setWithSpouse] = useState(false);
  const [childCount, setChildCount] = useState(0);

  return (
    <div className="rounded-lg border border-blue-200 bg-status-info-bg p-4">
      <h3 className="text-sm font-semibold text-status-info">{t("title")}</h3>
      <p className="mt-1 text-sm text-status-info">{t("description")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex min-h-[44px] items-center gap-3 text-sm font-medium text-gray-800">
          <Checkbox
            checked={withSpouse}
            onChange={(e) => setWithSpouse(e.target.checked)}
          />
          {tSections("spouseTitle")}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-800">{t("childrenLabel")}</span>
          <Input
            type="number"
            min={0}
            max={20}
            value={childCount}
            onChange={(e) =>
              setChildCount(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
            }
          />
        </label>
      </div>

      <Button
        type="button"
        onClick={() => onApply(withSpouse, childCount)}
        className="mt-4"
      >
        {t("prepare")}
      </Button>
    </div>
  );
}
