"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { createHousehold, updateHousehold } from "@/app/actions/household";
import {
  saveHouseholdPersons,
  upsertHouseholdPersons,
} from "@/app/actions/person";
import {
  lookupByEmail,
  unregisterHousehold,
} from "@/app/actions/registration";
import { EmailStep } from "@/components/registration/email-step";
import { HouseholdStep } from "@/components/registration/household-step";
import { MembersStep } from "@/components/registration/members-step";
import { UnregisterHouseholdSection } from "@/components/registration/unregister-household-section";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/routing";
import { householdToFormValues } from "@/lib/registration/mappers";
import { isSpouseFilled } from "@/lib/registration/spouse";
import { useSetRegistrationWizardStep } from "@/lib/registration/wizard-state-context";
import {
  defaultHouseholdPersons,
  defaultMember,
  emptyHouseholdDefaults,
  type EmailLookupFormValues,
  type HouseholdFormValues,
  type HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

function countRegisteredPersons(values: HouseholdPersonsFormValues) {
  const adults =
    1 +
    (isSpouseFilled(values.spouse) ? 1 : 0) +
    values.otherAdults.length;
  return { adults, children: values.children.length };
}

function membersDefaultsFromLookup(
  head: HouseholdPersonsFormValues["head"],
  spouse: HouseholdPersonsFormValues["spouse"] | null,
  otherAdults: HouseholdPersonsFormValues["otherAdults"],
  children: HouseholdPersonsFormValues["children"],
): HouseholdPersonsFormValues {
  return {
    head,
    spouse: spouse ?? { ...defaultMember, email: "", phone: "" },
    otherAdults,
    children,
  };
}

type Step = 0 | 1 | 2;
type RegistrationMode = "create" | "edit";

function getStepLookupNotice(
  step: Step,
  mode: RegistrationMode,
  lookupNotice: string | null,
  t: (key: string) => string,
): string | null {
  if (!lookupNotice || step === 0) return null;

  if (mode === "edit") {
    if (step === 1) return t("notices.householdFound");
    if (step === 2) return t("notices.personsReview");
  }

  if (mode === "create" && step === 1) {
    return t("notices.householdCreate");
  }

  return null;
}

type RegistrationWizardProps = {
  locale: Locale;
  initialEmail?: string;
};

type BannerMessage = {
  variant: "error" | "info" | "success";
  text: string;
};

export function RegistrationWizard({
  locale,
  initialEmail = "",
}: RegistrationWizardProps) {
  const t = useTranslations("wizard");
  const setWizardStep = useSetRegistrationWizardStep();

  const [step, setStep] = useState<Step>(0);
  const [mode, setMode] = useState<RegistrationMode>("create");
  const [lookupEmail, setLookupEmail] = useState(initialEmail);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdDefaults, setHouseholdDefaults] =
    useState<HouseholdFormValues>(emptyHouseholdDefaults);
  const [membersDefaults, setMembersDefaults] =
    useState<HouseholdPersonsFormValues>(defaultHouseholdPersons);
  const [lookupNotice, setLookupNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxReachedStep, setMaxReachedStep] = useState<Step>(0);

  const stepLabels = useMemo(
    () => [
      { n: 0 as const, label: t("steps.email") },
      { n: 1 as const, label: t("steps.household") },
      { n: 2 as const, label: t("steps.persons") },
    ],
    [t],
  );

  useEffect(() => {
    setWizardStep(step);
  }, [step, setWizardStep]);

  useEffect(() => {
    setMaxReachedStep((prev) => (step > prev ? step : prev));
  }, [step]);

  function resetWizard() {
    setStep(0);
    setMaxReachedStep(0);
    setMode("create");
    setLookupEmail("");
    setHouseholdId(null);
    setHouseholdDefaults(emptyHouseholdDefaults);
    setMembersDefaults(defaultHouseholdPersons);
    setLookupNotice(null);
    setServerError(null);
  }

  function handleStepClick(targetStep: Step) {
    if (targetStep > maxReachedStep || targetStep === step) return;
    setServerError(null);
    setStep(targetStep);
  }

  async function handleEmailSubmit(values: EmailLookupFormValues) {
    setServerError(null);
    setSuccessMessage(null);
    setLookupNotice(null);
    setIsSubmitting(true);

    const result = await lookupByEmail({ locale, email: values.email });
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(result.error ?? t("errors.lookupFailed"));
      return;
    }

    const email = values.email.trim();
    setLookupEmail(email);

    if (result.data.found) {
      setMode("edit");
      setHouseholdId(result.data.household.id);
      setHouseholdDefaults(householdToFormValues(result.data.household));
      setMembersDefaults(
        membersDefaultsFromLookup(
          result.data.head,
          result.data.spouse,
          result.data.otherAdults,
          result.data.children,
        ),
      );
      setLookupNotice(t("notices.householdFound"));
    } else {
      setMode("create");
      setHouseholdId(null);
      setHouseholdDefaults(emptyHouseholdDefaults);
      setMembersDefaults({
        head: {
          ...defaultMember,
          email,
          household_role: "chef_de_famille",
        },
        spouse: { ...defaultMember, email: "", phone: "" },
        otherAdults: [],
        children: [],
      });
      setLookupNotice(t("notices.registrationCreate"));
    }

    setStep(1);
    setMaxReachedStep(1);
  }

  async function handleHouseholdSubmit(values: HouseholdFormValues) {
    setServerError(null);
    setIsSubmitting(true);

    if (mode === "edit" && householdId) {
      const result = await updateHousehold(householdId, {
        locale,
        ...values,
      });
      setIsSubmitting(false);

      if (result.error || !result.data) {
        setServerError(result.error ?? t("errors.householdUpdateFailed"));
        return;
      }

      setHouseholdDefaults(householdToFormValues(result.data));
      setStep(2);
      setMaxReachedStep(2);
      return;
    }

    const result = await createHousehold({ locale, ...values });
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(result.error ?? t("errors.householdCreateFailed"));
      return;
    }

    setHouseholdId(result.data.id);
    setHouseholdDefaults(values);
    setStep(2);
    setMaxReachedStep(2);
  }

  async function handleMembersSubmit(values: HouseholdPersonsFormValues) {
    if (!householdId) {
      setServerError(t("errors.householdIdMissing"));
      return;
    }

    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const payload = { locale, ...values };
    const result =
      mode === "edit"
        ? await upsertHouseholdPersons(householdId, payload)
        : await saveHouseholdPersons(householdId, payload);

    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(
        result.error ??
          (mode === "edit"
            ? t("errors.membersUpdateFailed")
            : t("errors.membersSaveFailed")),
      );
      return;
    }

    const { adults, children } = countRegisteredPersons(values);
    const summary =
      children > 0
        ? t("success.summaryWithChildren", { adults, children })
        : t("success.summaryAdultsOnly", { adults });

    setSuccessMessage(
      mode === "edit"
        ? t("success.updated", { summary })
        : t("success.registered", { summary }),
    );
    resetWizard();
  }

  function handleBackFromHousehold() {
    setServerError(null);
    setLookupNotice(null);
    setStep(0);
  }

  function handleBackFromMembers() {
    setServerError(null);
    setStep(1);
  }

  async function handleUnregister() {
    if (!householdId || !lookupEmail) {
      throw new Error(t("errors.unregisterMissing"));
    }

    setServerError(null);
    const result = await unregisterHousehold({
      locale,
      householdId,
      email: lookupEmail,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    setSuccessMessage(t("success.unregistered"));
    resetWizard();
  }

  const stepLookupNotice = getStepLookupNotice(step, mode, lookupNotice, t);

  const bannerMessage: BannerMessage | null = serverError
    ? { variant: "error", text: serverError }
    : successMessage
      ? { variant: "success", text: successMessage }
      : stepLookupNotice
        ? { variant: "info", text: stepLookupNotice }
        : null;

  const showUnregister =
    mode === "edit" && householdId && lookupEmail && step > 0;

  return (
    <div
      className={cn(
        "w-full transition-[max-width] duration-200",
        step === 2 ? "max-w-3xl" : "max-w-2xl",
      )}
    >
      <nav aria-label={t("progress")} className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
          {stepLabels.map(({ n, label }, index) => {
            const isCurrent = step === n;
            const isCompleted = n < step;
            const isClickable = n <= maxReachedStep && !isCurrent;

            return (
              <li key={n} className="flex items-center gap-2 sm:gap-3">
                {index > 0 ? (
                  <span className="text-gray-300" aria-hidden>
                    →
                  </span>
                ) : null}
                {isClickable ? (
                  <button
                    type="button"
                    onClick={() => handleStepClick(n)}
                    className="flex items-center gap-2 rounded-md text-gray-600 transition-colors hover:text-primary focus-ring"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      {n + 1}
                    </span>
                    <span className="font-medium">{label}</span>
                  </button>
                ) : (
                  <span
                    className={cn(
                      "flex items-center gap-2",
                      isCurrent
                        ? "font-semibold text-primary"
                        : isCompleted
                          ? "text-gray-600"
                          : "text-gray-400",
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-200 text-gray-500",
                      )}
                    >
                      {n + 1}
                    </span>
                    <span>{label}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {bannerMessage ? (
        <Alert variant={bannerMessage.variant} className="mb-4">
          {bannerMessage.text}
        </Alert>
      ) : null}

      {step === 0 ? (
        <EmailStep
          defaultEmail={lookupEmail || initialEmail}
          onSubmit={handleEmailSubmit}
          isSubmitting={isSubmitting}
        />
      ) : null}

      {step === 1 ? (
        <HouseholdStep
          key={`household-${householdId ?? "new"}-${mode}`}
          defaultValues={householdDefaults}
          onSubmit={handleHouseholdSubmit}
          onBack={handleBackFromHousehold}
          isSubmitting={isSubmitting}
        />
      ) : null}

      {step === 2 ? (
        <MembersStep
          key={`members-${householdId ?? "new"}-${mode}`}
          defaultValues={membersDefaults}
          isEditMode={mode === "edit"}
          submitLabel={
            mode === "edit" ? t("buttons.saveChanges") : undefined
          }
          onSubmit={handleMembersSubmit}
          onBack={handleBackFromMembers}
          isSubmitting={isSubmitting}
        />
      ) : null}

      {showUnregister ? (
        <UnregisterHouseholdSection
          variant="link"
          onUnregister={handleUnregister}
          disabled={isSubmitting}
        />
      ) : null}
    </div>
  );
}
