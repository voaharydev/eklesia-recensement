"use client";

import { useState } from "react";

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
import {
  defaultHouseholdPersons,
  defaultMember,
  type EmailLookupFormValues,
  type HouseholdFormValues,
  type HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

type Step = 0 | 1 | 2;
type RegistrationMode = "create" | "edit";

function getStepLookupNotice(
  step: Step,
  mode: RegistrationMode,
  lookupNotice: string | null,
): string | null {
  if (!lookupNotice || step === 0) return null;

  if (mode === "edit") {
    if (step === 1) {
      return "Nous avons retrouvé votre foyer. Vérifiez et mettez à jour si nécessaire.";
    }
    if (step === 2) {
      return "Vérifiez les membres adultes et les enfants rattachés à votre foyer.";
    }
  }

  if (mode === "create" && step === 1) {
    return "Aucun dossier trouvé pour ce courriel. Complétez les informations de votre foyer.";
  }

  return null;
}

const emptyHouseholdDefaults: HouseholdFormValues = {
  name: "",
  main_address: "",
};

type RegistrationWizardProps = {
  initialEmail?: string;
};

export function RegistrationWizard({
  initialEmail = "",
}: RegistrationWizardProps) {
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

  function resetWizard() {
    setStep(0);
    setMode("create");
    setLookupEmail("");
    setHouseholdId(null);
    setHouseholdDefaults(emptyHouseholdDefaults);
    setMembersDefaults(defaultHouseholdPersons);
    setLookupNotice(null);
    setServerError(null);
  }

  async function handleEmailSubmit(values: EmailLookupFormValues) {
    setServerError(null);
    setSuccessMessage(null);
    setLookupNotice(null);
    setIsSubmitting(true);

    const result = await lookupByEmail(values);
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(result.error ?? "Impossible de rechercher ce courriel.");
      return;
    }

    const email = values.email.trim();
    setLookupEmail(email);

    if (result.data.found) {
      setMode("edit");
      setHouseholdId(result.data.household.id);
      setHouseholdDefaults({
        name: result.data.household.name,
        main_address: result.data.household.main_address,
      });
      setMembersDefaults({
        members: result.data.members,
        children: result.data.children,
      });
      setLookupNotice(
        "Nous avons retrouvé votre foyer. Vérifiez et mettez à jour si nécessaire.",
      );
    } else {
      setMode("create");
      setHouseholdId(null);
      setHouseholdDefaults(emptyHouseholdDefaults);
      setMembersDefaults({
        members: [{ ...defaultMember, email }],
        children: [],
      });
      setLookupNotice(
        "Aucun dossier trouvé pour ce courriel. Complétez votre inscription.",
      );
    }

    setStep(1);
  }

  async function handleHouseholdSubmit(values: HouseholdFormValues) {
    setServerError(null);
    setIsSubmitting(true);

    if (mode === "edit" && householdId) {
      const result = await updateHousehold(householdId, values);
      setIsSubmitting(false);

      if (result.error || !result.data) {
        setServerError(
          result.error ?? "Erreur lors de la mise à jour du foyer.",
        );
        return;
      }

      setHouseholdDefaults({
        name: result.data.name,
        main_address: result.data.main_address,
      });
      setStep(2);
      return;
    }

    const result = await createHousehold(values);
    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(result.error ?? "Erreur lors de la création du foyer.");
      return;
    }

    setHouseholdId(result.data.id);
    setHouseholdDefaults(values);
    setStep(2);
  }

  async function handleMembersSubmit(values: HouseholdPersonsFormValues) {
    if (!householdId) {
      setServerError("Identifiant de foyer manquant. Recommencez à l'étape 1.");
      return;
    }

    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const result =
      mode === "edit"
        ? await upsertHouseholdPersons(householdId, values)
        : await saveHouseholdPersons(householdId, values);

    setIsSubmitting(false);

    if (result.error || !result.data) {
      setServerError(
        result.error ??
          (mode === "edit"
            ? "Erreur lors de la mise à jour des membres."
            : "Erreur lors de l'enregistrement des membres."),
      );
      return;
    }

    const adults = values.members.length;
    const children = values.children.length;
    const summary =
      children > 0
        ? `${adults} membre(s) adulte(s) et ${children} enfant(s)`
        : `${adults} membre(s) adulte(s)`;

    setSuccessMessage(
      mode === "edit"
        ? `Vos informations ont été mises à jour (${summary}).`
        : `Inscription réussie ! ${summary} enregistré(s).`,
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
      throw new Error("Impossible de désinscrire : foyer ou courriel manquant.");
    }

    setServerError(null);
    const result = await unregisterHousehold({
      householdId,
      email: lookupEmail,
    });

    if (result.error) {
      throw new Error(result.error);
    }

    setSuccessMessage(
      "Votre foyer a été désinscrit du recensement. Vous pouvez vous réinscrire à tout moment avec le même courriel.",
    );
    resetWizard();
  }

  const unregisterSection =
    mode === "edit" && householdId && lookupEmail ? (
      <UnregisterHouseholdSection
        onUnregister={handleUnregister}
        disabled={isSubmitting}
      />
    ) : null;

  const stepLabels = [
    { n: 0, label: "Courriel" },
    { n: 1, label: "Foyer" },
    { n: 2, label: "Personnes" },
  ] as const;

  const stepLookupNotice = getStepLookupNotice(step, mode, lookupNotice);

  return (
    <div
      className={`w-full ${step === 2 ? "max-w-3xl" : "max-w-lg"}`}
    >
      <nav aria-label="Progression" className="mb-8">
        <ol className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
          {stepLabels.map(({ n, label }, index) => (
            <li key={n} className="flex items-center gap-3">
              {index > 0 ? (
                <span className="text-gray-300" aria-hidden>
                  →
                </span>
              ) : null}
              <span
                className={
                  step === n
                    ? "font-semibold text-indigo-600"
                    : "text-gray-500"
                }
              >
                <span
                  className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    step === n
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {n + 1}
                </span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      {serverError ? (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      {stepLookupNotice ? (
        <div
          className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900"
          role="status"
        >
          {stepLookupNotice}
        </div>
      ) : null}

      {successMessage ? (
        <div
          className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {successMessage}
        </div>
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
          afterForm={unregisterSection}
        />
      ) : null}

      {step === 2 ? (
        <MembersStep
          key={`members-${householdId ?? "new"}-${mode}`}
          defaultValues={membersDefaults}
          isEditMode={mode === "edit"}
          submitLabel={
            mode === "edit" ? "Enregistrer les modifications" : undefined
          }
          onSubmit={handleMembersSubmit}
          onBack={handleBackFromMembers}
          isSubmitting={isSubmitting}
          afterForm={unregisterSection}
        />
      ) : null}
    </div>
  );
}
