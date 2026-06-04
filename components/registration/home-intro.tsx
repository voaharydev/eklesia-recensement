"use client";

import { useTranslations } from "next-intl";

import { useRegistrationWizardStep } from "@/lib/registration/wizard-state-context";

export function HomeIntro() {
  const t = useTranslations("home");
  const step = useRegistrationWizardStep();

  if (step > 0) {
    return null;
  }

  return <p className="mt-4 text-gray-600">{t("intro")}</p>;
}
