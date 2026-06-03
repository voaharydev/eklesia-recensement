"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";

import { FieldErrorSummary } from "@/components/registration/field-error-summary";
import { FormField } from "@/components/registration/form-field";
import { HouseholdChildFields } from "@/components/registration/household-child-fields";
import { HouseholdSizePrompt } from "@/components/registration/household-size-prompt";
import { MemberChurchFields } from "@/components/registration/member-church-fields";
import { PersonAccordionCard } from "@/components/registration/person-accordion-card";
import {
  PersonQuickNav,
  type PersonNavItem,
} from "@/components/registration/person-quick-nav";
import { MIN_ADULT_AGE } from "@/lib/constants/ages";
import {
  childHasErrors,
  findFirstErrorIndex,
  getChildErrorMessages,
  getChildSummary,
  getMemberErrorMessages,
  getMemberSummary,
  isChildComplete,
  isMemberComplete,
  memberHasChurchData,
  memberHasChurchErrors,
  memberHasErrors,
} from "@/lib/registration/person-form-ui";
import {
  defaultChild,
  defaultMember,
  householdPersonsSchema,
  type HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

type MembersStepProps = {
  defaultValues: HouseholdPersonsFormValues;
  isEditMode?: boolean;
  submitLabel?: string;
  onSubmit: (values: HouseholdPersonsFormValues) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  afterForm?: ReactNode;
};

export function MembersStep({
  defaultValues,
  isEditMode = false,
  submitLabel = "Terminer l'inscription",
  onSubmit,
  onBack,
  isSubmitting,
  afterForm,
}: MembersStepProps) {
  const [openAdultIndex, setOpenAdultIndex] = useState<number | null>(0);
  const [openChildIndex, setOpenChildIndex] = useState<number | null>(null);
  const [churchExpanded, setChurchExpanded] = useState<Record<string, boolean>>(
    {},
  );
  const [sizePromptDone, setSizePromptDone] = useState(
    isEditMode || defaultValues.members.length > 1 || defaultValues.children.length > 0,
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, submitCount },
  } = useForm<HouseholdPersonsFormValues>({
    resolver: zodResolver(householdPersonsSchema),
    defaultValues,
  });

  const watchedValues = watch();

  useEffect(() => {
    reset(defaultValues);
    setOpenAdultIndex(0);
    setOpenChildIndex(null);
    setSizePromptDone(
      isEditMode ||
        defaultValues.members.length > 1 ||
        defaultValues.children.length > 0,
    );
  }, [defaultValues, reset, isEditMode]);

  const {
    fields: memberFields,
    append: appendMember,
    remove: removeMember,
  } = useFieldArray({
    control,
    name: "members",
  });

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: "children",
  });

  const scrollToCard = useCallback((cardId: string) => {
    document.getElementById(cardId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const openAdult = useCallback(
    (index: number) => {
      setOpenAdultIndex(index);
      setOpenChildIndex(null);
      scrollToCard(`adult-card-${index}`);
    },
    [scrollToCard],
  );

  const openChild = useCallback(
    (index: number) => {
      setOpenChildIndex(index);
      setOpenAdultIndex(null);
      scrollToCard(`child-card-${index}`);
    },
    [scrollToCard],
  );

  const toggleChurch = useCallback((key: string) => {
    setChurchExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandChurchForMember = useCallback((index: number) => {
    setChurchExpanded((prev) => ({ ...prev, [`member-${index}`]: true }));
  }, []);

  function isChurchExpanded(
    index: number,
    member: (typeof watchedValues.members)[number],
  ) {
    const key = `member-${index}`;
    if (memberHasChurchErrors(errors.members, index)) {
      return true;
    }
    if (key in churchExpanded) {
      return churchExpanded[key];
    }
    return openAdultIndex === index && (isEditMode || memberHasChurchData(member));
  }

  useEffect(() => {
    if (submitCount === 0) return;
    const count = memberFields.length;
    for (let index = 0; index < count; index += 1) {
      if (memberHasChurchErrors(errors.members, index)) {
        expandChurchForMember(index);
      }
    }
  }, [errors.members, submitCount, memberFields, expandChurchForMember]);

  const navItems: PersonNavItem[] = useMemo(() => {
    const adults: PersonNavItem[] = memberFields.map((field, index) => ({
      id: field.id,
      label: `Adulte ${index + 1}`,
      kind: "adult" as const,
      index,
      hasError: memberHasErrors(errors.members, index),
      isActive: openAdultIndex === index && openChildIndex === null,
    }));
    const children: PersonNavItem[] = childFields.map((field, index) => ({
      id: field.id,
      label: `Enfant ${index + 1}`,
      kind: "child" as const,
      index,
      hasError: childHasErrors(errors.children, index),
      isActive: openChildIndex === index,
    }));
    return [...adults, ...children];
  }, [
    memberFields,
    childFields,
    errors.members,
    errors.children,
    openAdultIndex,
    openChildIndex,
  ]);

  function handleNavSelect(item: PersonNavItem) {
    if (item.kind === "adult") {
      openAdult(item.index);
    } else {
      openChild(item.index);
    }
  }

  function handleApplyHouseholdSize(adultCount: number, childCount: number) {
    for (let i = memberFields.length; i < adultCount; i++) {
      appendMember(defaultMember);
    }
    let adultsToRemove = memberFields.length - adultCount;
    while (adultsToRemove > 0 && memberFields.length > 1) {
      removeMember(memberFields.length - 1);
      adultsToRemove -= 1;
    }

    for (let i = childFields.length; i < childCount; i++) {
      appendChild(defaultChild);
    }
    let childrenToRemove = childFields.length - childCount;
    while (childrenToRemove > 0) {
      removeChild(childFields.length - 1);
      childrenToRemove -= 1;
    }

    setSizePromptDone(true);
    setOpenAdultIndex(0);
    setOpenChildIndex(null);
  }

  function applyBranchToAll() {
    const sourceBranches = watchedValues.members?.[0]?.branches ?? [];
    const clone = sourceBranches.map((entry) => ({
      branch_code: entry.branch_code,
      role: entry.role ?? "",
    }));
    memberFields.forEach((_, index) => {
      if (index > 0) {
        setValue(`members.${index}.branches`, clone);
      }
    });
  }

  function applyLastNameToAll() {
    const lastName = watchedValues.members?.[0]?.last_name ?? "";
    memberFields.forEach((_, index) => {
      if (index > 0) {
        setValue(`members.${index}.last_name`, lastName);
      }
    });
  }

  const onInvalid = useCallback(
    (formErrors: FieldErrors<HouseholdPersonsFormValues>) => {
      const first = findFirstErrorIndex(formErrors);
      if (!first) return;
      if (first.kind === "adult") {
        openAdult(first.index);
        if (memberHasChurchErrors(formErrors.members, first.index)) {
          expandChurchForMember(first.index);
        }
      } else {
        openChild(first.index);
      }
    },
    [openAdult, openChild, expandChurchForMember],
  );

  const showSizePrompt =
    !isEditMode && !sizePromptDone && memberFields.length <= 1 && childFields.length === 0;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-8"
      noValidate
    >
      {showSizePrompt ? (
        <HouseholdSizePrompt onApply={handleApplyHouseholdSize} />
      ) : (
        <>
          <PersonQuickNav items={navItems} onSelect={handleNavSelect} />

          <section className="flex flex-col gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Membres adultes
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Personnes de plus de 15 ans ({MIN_ADULT_AGE} ans minimum). Une
                carte à la fois pour faciliter la saisie.
              </p>
            </div>

            {memberFields.length >= 2 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyBranchToAll}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Appliquer les branches du 1er membre à tous
                </button>
                <button
                  type="button"
                  onClick={applyLastNameToAll}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Même nom de famille que le 1er membre
                </button>
              </div>
            ) : null}

            {errors.members?.message ? (
              <p className="text-sm text-red-600" role="alert">
                {errors.members.message}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              {memberFields.map((field, index) => {
                const member = watchedValues.members?.[index];
                const churchKey = `member-${index}`;

                return (
                  <PersonAccordionCard
                    key={field.id}
                    cardId={`adult-card-${index}`}
                    title={`Membre adulte ${index + 1}`}
                    summary={getMemberSummary(member)}
                    isOpen={openAdultIndex === index}
                    onToggle={() =>
                      openAdultIndex === index
                        ? setOpenAdultIndex(null)
                        : openAdult(index)
                    }
                    hasError={memberHasErrors(errors.members, index)}
                    isComplete={isMemberComplete(member)}
                    variant="adult"
                  >
                    {member?.id ? (
                      <input
                        type="hidden"
                        {...register(`members.${index}.id`)}
                      />
                    ) : null}
                    <div className="flex flex-col gap-4">
                      {memberHasErrors(errors.members, index) ? (
                        <FieldErrorSummary
                          messages={getMemberErrorMessages(
                            errors.members,
                            index,
                          )}
                        />
                      ) : null}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          label="Prénom"
                          error={errors.members?.[index]?.first_name?.message}
                          {...register(`members.${index}.first_name`)}
                        />
                        <FormField
                          label="Nom"
                          error={errors.members?.[index]?.last_name?.message}
                          {...register(`members.${index}.last_name`)}
                        />
                      </div>
                      <FormField
                        label="E-mail (optionnel)"
                        type="email"
                        error={errors.members?.[index]?.email?.message}
                        {...register(`members.${index}.email`)}
                      />
                      <FormField
                        label="Téléphone (optionnel)"
                        type="tel"
                        error={errors.members?.[index]?.phone?.message}
                        {...register(`members.${index}.phone`)}
                      />
                      <FormField
                        label="Langue préférée"
                        error={errors.members?.[index]?.preferred_language?.message}
                        {...register(`members.${index}.preferred_language`)}
                      />
                      <FormField
                        label="Âge"
                        type="number"
                        min={MIN_ADULT_AGE}
                        max={120}
                        inputMode="numeric"
                        error={errors.members?.[index]?.age?.message}
                        {...register(`members.${index}.age`)}
                      />
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          {...register(`members.${index}.is_visible_in_directory`)}
                        />
                        Visible dans l&apos;annuaire
                      </label>

                      <MemberChurchFields
                        index={index}
                        control={control}
                        register={register}
                        watch={watch}
                        errors={errors.members}
                        isExpanded={isChurchExpanded(index, member)}
                        onToggle={() => toggleChurch(churchKey)}
                      />

                      {memberFields.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            removeMember(index);
                            if (openAdultIndex === index) {
                              setOpenAdultIndex(0);
                            }
                          }}
                          className="self-start text-sm text-red-600 hover:text-red-700"
                        >
                          Retirer ce membre
                        </button>
                      ) : null}
                    </div>
                  </PersonAccordionCard>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                appendMember(defaultMember);
                openAdult(memberFields.length);
              }}
              className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Ajouter un membre adulte
            </button>
          </section>

          <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Enfants du foyer
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Enfants de 15 ans et moins rattachés au foyer (facultatif).
              </p>
            </div>

            {childFields.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun enfant ajouté.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {childFields.map((field, index) => {
                  const child = watchedValues.children?.[index];

                  return (
                    <PersonAccordionCard
                      key={field.id}
                      cardId={`child-card-${index}`}
                      title={`Enfant ${index + 1}`}
                      summary={getChildSummary(child)}
                      isOpen={openChildIndex === index}
                      onToggle={() =>
                        openChildIndex === index
                          ? setOpenChildIndex(null)
                          : openChild(index)
                      }
                      hasError={childHasErrors(errors.children, index)}
                      isComplete={isChildComplete(child)}
                      variant="child"
                    >
                      {child?.id ? (
                        <input
                          type="hidden"
                          {...register(`children.${index}.id`)}
                        />
                      ) : null}
                      <div className="flex flex-col gap-4">
                        {childHasErrors(errors.children, index) ? (
                          <FieldErrorSummary
                            messages={getChildErrorMessages(
                              errors.children,
                              index,
                            )}
                          />
                        ) : null}
                        <HouseholdChildFields
                          index={index}
                          register={register}
                          watch={watch}
                          errors={errors.children}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            removeChild(index);
                            if (openChildIndex === index) {
                              setOpenChildIndex(null);
                            }
                          }}
                          className="self-start text-sm text-red-600 hover:text-red-700"
                        >
                          Retirer cet enfant
                        </button>
                      </div>
                    </PersonAccordionCard>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                appendChild(defaultChild);
                openChild(childFields.length);
              }}
              className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              + Ajouter un enfant
            </button>
          </section>
        </>
      )}

      {afterForm}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          Retour
        </button>
        {!showSizePrompt ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Enregistrement…" : submitLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
