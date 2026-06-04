"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";

import { HouseholdChildFields } from "@/components/registration/household-child-fields";
import { HouseholdSizePrompt } from "@/components/registration/household-size-prompt";
import { MemberAdultFields } from "@/components/registration/member-adult-fields";
import { PersonAccordionCard } from "@/components/registration/person-accordion-card";
import {
  PersonQuickNav,
  type PersonNavItem,
} from "@/components/registration/person-quick-nav";
import { isSpouseFilled } from "@/lib/registration/spouse";
import {
  adultHasChurchData,
  adultHasChurchErrors,
  adultHasErrors,
  childHasErrors,
  findFirstErrorIndex,
  otherAdultHasChurchErrors,
  otherAdultHasErrors,
  getChildSummary,
  getMemberSummary,
  isChildComplete,
  isMemberComplete,
} from "@/lib/registration/person-form-ui";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import {
  defaultChild,
  defaultMember,
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
  submitLabel,
  onSubmit,
  onBack,
  isSubmitting,
  afterForm,
}: MembersStepProps) {
  const tWizard = useTranslations("wizard");
  const tForm = useTranslations("form.person");
  const { schemas } = useRegistrationSchemas();
  const resolver = useMemo(
    () => zodResolver(schemas.householdPersonsSchema),
    [schemas],
  );

  const resolvedSubmitLabel =
    submitLabel ?? tWizard("buttons.finishRegistration");

  const initialHasSpouse = isSpouseFilled(defaultValues.spouse);

  const [hasSpouse, setHasSpouse] = useState(initialHasSpouse);
  const [openSection, setOpenSection] = useState<
    "head" | "spouse" | "otherAdult" | "child"
  >("head");
  const [openOtherAdultIndex, setOpenOtherAdultIndex] = useState<number | null>(
    null,
  );
  const [openChildIndex, setOpenChildIndex] = useState<number | null>(null);
  const [churchExpanded, setChurchExpanded] = useState<
    Record<string, boolean>
  >({});

  const [sizePromptDone, setSizePromptDone] = useState(
    isEditMode ||
      initialHasSpouse ||
      defaultValues.children.length > 0,
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
    resolver,
    defaultValues,
  });

  const watchedValues = watch();

  const summaryLabels = useMemo(
    () => ({
      notProvided: tForm("notProvided"),
      ageSummary: (age: string) => tForm("ageSummary", { age }),
    }),
    [tForm],
  );

  useEffect(() => {
    reset(defaultValues);
    setHasSpouse(isSpouseFilled(defaultValues.spouse));
    setOpenSection("head");
    setOpenChildIndex(null);
    setSizePromptDone(
      isEditMode ||
        isSpouseFilled(defaultValues.spouse) ||
        defaultValues.otherAdults.length > 0 ||
        defaultValues.children.length > 0,
    );
  }, [defaultValues, reset, isEditMode]);

  const {
    fields: otherAdultFields,
    append: appendOtherAdult,
    remove: removeOtherAdult,
  } = useFieldArray({
    control,
    name: "otherAdults",
  });

  const {
    fields: childFields,
    append: appendChild,
    remove: removeChild,
  } = useFieldArray({
    control,
    name: "children",
  });

  const toggleChurch = useCallback((key: string) => {
    setChurchExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandChurchForAdult = useCallback((key: string) => {
    setChurchExpanded((prev) => ({ ...prev, [key]: true }));
  }, []);

  function isChurchExpanded(
    key: string,
    member: Parameters<typeof adultHasChurchData>[0],
    sectionMatches: boolean,
  ) {
    if (
      key === "head"
        ? adultHasChurchErrors(errors, "head")
        : key === "spouse"
          ? adultHasChurchErrors(errors, "spouse")
          : /^otherAdults\.\d+$/.test(key) &&
            otherAdultHasChurchErrors(
              errors,
              Number(key.replace("otherAdults.", "")),
            )
    ) {
      return true;
    }
    if (key in churchExpanded) {
      return churchExpanded[key];
    }
    return sectionMatches && (isEditMode || adultHasChurchData(member));
  }

  useEffect(() => {
    if (submitCount === 0) return;
    if (adultHasChurchErrors(errors, "head")) {
      expandChurchForAdult("head");
    }
    if (hasSpouse && adultHasChurchErrors(errors, "spouse")) {
      expandChurchForAdult("spouse");
    }
    otherAdultFields.forEach((_, index) => {
      if (otherAdultHasChurchErrors(errors, index)) {
        expandChurchForAdult(`otherAdults.${index}`);
      }
    });
  }, [errors, submitCount, hasSpouse, otherAdultFields, expandChurchForAdult]);

  const navItems: PersonNavItem[] = useMemo(() => {
    const items: PersonNavItem[] = [
      {
        id: "head",
        label: tWizard("sections.headTitle"),
        kind: "adult",
        index: 0,
        hasError: adultHasErrors(errors, "head"),
        isActive: openSection === "head",
      },
    ];
    if (hasSpouse) {
      items.push({
        id: "spouse",
        label: tWizard("sections.spouseTitle"),
        kind: "adult",
        index: 1,
        hasError: adultHasErrors(errors, "spouse"),
        isActive: openSection === "spouse",
      });
    }
    const otherAdults: PersonNavItem[] = otherAdultFields.map(
      (field, index) => ({
        id: field.id,
        label: tWizard("nav.otherAdult", { n: index + 1 }),
        kind: "otherAdult" as const,
        index,
        hasError: otherAdultHasErrors(errors.otherAdults, index),
        isActive:
          openSection === "otherAdult" && openOtherAdultIndex === index,
      }),
    );
    const children: PersonNavItem[] = childFields.map((field, index) => ({
      id: field.id,
      label: tWizard("nav.child", { n: index + 1 }),
      kind: "child" as const,
      index,
      hasError: childHasErrors(errors.children, index),
      isActive: openSection === "child" && openChildIndex === index,
    }));
    return [...items, ...otherAdults, ...children];
  }, [
    childFields,
    errors,
    hasSpouse,
    openSection,
    openChildIndex,
    openOtherAdultIndex,
    otherAdultFields,
    tWizard,
  ]);

  function handleNavSelect(item: PersonNavItem) {
    if (item.id === "head") {
      setOpenSection("head");
      setOpenChildIndex(null);
      setOpenOtherAdultIndex(null);
      return;
    }
    if (item.id === "spouse") {
      setOpenSection("spouse");
      setOpenChildIndex(null);
      setOpenOtherAdultIndex(null);
      return;
    }
    if (item.kind === "otherAdult") {
      setOpenSection("otherAdult");
      setOpenOtherAdultIndex(item.index);
      setOpenChildIndex(null);
      return;
    }
    if (item.kind === "child") {
      setOpenSection("child");
      setOpenChildIndex(item.index);
      setOpenOtherAdultIndex(null);
    }
  }

  function handleApplyHouseholdSize(withSpouse: boolean, childCount: number) {
    setHasSpouse(withSpouse);
    if (!withSpouse) {
      setValue("spouse", { ...defaultMember, email: "", phone: "" });
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
    setOpenSection("head");
    setOpenChildIndex(null);
    setOpenOtherAdultIndex(null);
  }

  function enableSpouse() {
    setHasSpouse(true);
    if (!isSpouseFilled(watchedValues.spouse)) {
      setValue("spouse", {
        ...defaultMember,
        last_name: watchedValues.head?.last_name ?? "",
        email: "",
        phone: "",
      });
    }
    setOpenSection("spouse");
  }

  function disableSpouse() {
    setHasSpouse(false);
    setValue("spouse", { ...defaultMember, email: "", phone: "" });
    if (openSection === "spouse") {
      setOpenSection("head");
    }
  }

  function applyLastNameToSpouse() {
    const lastName = watchedValues.head?.last_name ?? "";
    setValue("spouse.last_name", lastName);
  }

  const onInvalid = useCallback(
    (formErrors: FieldErrors<HouseholdPersonsFormValues>) => {
      const first = findFirstErrorIndex(
        formErrors,
        hasSpouse,
        otherAdultFields.length,
      );
      if (!first) return;
      if (first.kind === "head") {
        setOpenSection("head");
        if (adultHasChurchErrors(formErrors, "head")) {
          expandChurchForAdult("head");
        }
      } else if (first.kind === "spouse") {
        setOpenSection("spouse");
        if (adultHasChurchErrors(formErrors, "spouse")) {
          expandChurchForAdult("spouse");
        }
      } else if (first.kind === "otherAdult" && first.index != null) {
        setOpenSection("otherAdult");
        setOpenOtherAdultIndex(first.index);
        if (otherAdultHasChurchErrors(formErrors, first.index)) {
          expandChurchForAdult(`otherAdults.${first.index}`);
        }
      } else if (first.kind === "child" && first.index != null) {
        setOpenSection("child");
        setOpenChildIndex(first.index);
      }
    },
    [hasSpouse, otherAdultFields.length, expandChurchForAdult],
  );

  const showSizePrompt = !isEditMode && !sizePromptDone;

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
                {tWizard("sections.headTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {tWizard("sections.headDescription")}
              </p>
            </div>

            <PersonAccordionCard
              cardId="adult-card-head"
              title={tWizard("sections.headTitle")}
              summary={getMemberSummary(watchedValues.head, summaryLabels)}
              isOpen={openSection === "head"}
              onToggle={() => {
                setOpenSection("head");
                setOpenChildIndex(null);
                setOpenOtherAdultIndex(null);
              }}
              hasError={adultHasErrors(errors, "head")}
              isComplete={isMemberComplete(watchedValues.head)}
              variant="adult"
            >
              {watchedValues.head?.id ? (
                <input type="hidden" {...register("head.id")} />
              ) : null}
              <MemberAdultFields
                fieldPrefix="head"
                control={control}
                register={register}
                watch={watch}
                errors={errors}
                onToggleChurch={() => toggleChurch("head")}
                isChurchExpanded={isChurchExpanded(
                  "head",
                  watchedValues.head,
                  openSection === "head",
                )}
              />
            </PersonAccordionCard>
          </section>

          <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {tWizard("sections.spouseTitle")}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {tWizard("sections.spouseDescription")}
                </p>
              </div>
              {hasSpouse ? (
                <button
                  type="button"
                  onClick={disableSpouse}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  {tWizard("sections.removeSpouse")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={enableSpouse}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {tWizard("sections.addSpouse")}
                </button>
              )}
            </div>

            {hasSpouse ? (
              <>
                <button
                  type="button"
                  onClick={applyLastNameToSpouse}
                  className="self-start rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {tWizard("shortcuts.sameLastName")}
                </button>

                <PersonAccordionCard
                  cardId="adult-card-spouse"
                  title={tWizard("sections.spouseTitle")}
                  summary={getMemberSummary(
                    watchedValues.spouse,
                    summaryLabels,
                  )}
                  isOpen={openSection === "spouse"}
                  onToggle={() =>
                    setOpenSection(
                      openSection === "spouse" ? "head" : "spouse",
                    )
                  }
                  hasError={adultHasErrors(errors, "spouse")}
                  isComplete={isMemberComplete(watchedValues.spouse)}
                  variant="adult"
                >
                  {watchedValues.spouse?.id ? (
                    <input type="hidden" {...register("spouse.id")} />
                  ) : null}
                  <MemberAdultFields
                    fieldPrefix="spouse"
                    control={control}
                    register={register}
                    watch={watch}
                    errors={errors}
                    onToggleChurch={() => toggleChurch("spouse")}
                    isChurchExpanded={isChurchExpanded(
                      "spouse",
                      watchedValues.spouse,
                      openSection === "spouse",
                    )}
                  />
                </PersonAccordionCard>
              </>
            ) : null}
          </section>

          <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {tWizard("sections.otherAdultsTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {tWizard("sections.otherAdultsDescription")}
              </p>
            </div>

            {otherAdultFields.length === 0 ? (
              <p className="text-sm text-gray-500">
                {tWizard("sections.noOtherAdults")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {otherAdultFields.map((field, index) => {
                  const adult = watchedValues.otherAdults?.[index];
                  const fieldPrefix = `otherAdults.${index}` as const;

                  return (
                    <PersonAccordionCard
                      key={field.id}
                      cardId={`other-adult-card-${index}`}
                      title={tWizard("nav.otherAdult", { n: index + 1 })}
                      summary={getMemberSummary(adult, summaryLabels)}
                      isOpen={
                        openSection === "otherAdult" &&
                        openOtherAdultIndex === index
                      }
                      onToggle={() => {
                        if (
                          openSection === "otherAdult" &&
                          openOtherAdultIndex === index
                        ) {
                          setOpenOtherAdultIndex(null);
                        } else {
                          setOpenSection("otherAdult");
                          setOpenOtherAdultIndex(index);
                        }
                      }}
                      hasError={otherAdultHasErrors(errors.otherAdults, index)}
                      isComplete={isMemberComplete(adult)}
                      variant="adult"
                    >
                      {adult?.id ? (
                        <input
                          type="hidden"
                          {...register(`otherAdults.${index}.id`)}
                        />
                      ) : null}
                      <div className="flex flex-col gap-4">
                        <MemberAdultFields
                          fieldPrefix={fieldPrefix}
                          control={control}
                          register={register}
                          watch={watch}
                          errors={errors}
                          onToggleChurch={() => toggleChurch(fieldPrefix)}
                          isChurchExpanded={isChurchExpanded(
                            fieldPrefix,
                            adult,
                            openSection === "otherAdult" &&
                              openOtherAdultIndex === index,
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            removeOtherAdult(index);
                            if (openOtherAdultIndex === index) {
                              setOpenOtherAdultIndex(null);
                            }
                          }}
                          className="self-start text-sm text-red-600 hover:text-red-700"
                        >
                          {tWizard("sections.removeOtherAdult")}
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
                appendOtherAdult({ ...defaultMember, email: "", phone: "" });
                setOpenSection("otherAdult");
                setOpenOtherAdultIndex(otherAdultFields.length);
              }}
              className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {tWizard("sections.addOtherAdult")}
            </button>
          </section>

          <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {tWizard("sections.childrenTitle")}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {tWizard("sections.childrenDescription")}
              </p>
            </div>

            {childFields.length === 0 ? (
              <p className="text-sm text-gray-500">
                {tWizard("sections.noChildren")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {childFields.map((field, index) => {
                  const child = watchedValues.children?.[index];

                  return (
                    <PersonAccordionCard
                      key={field.id}
                      cardId={`child-card-${index}`}
                      title={tForm("childTitle", { n: index + 1 })}
                      summary={getChildSummary(child, summaryLabels)}
                      isOpen={
                        openSection === "child" && openChildIndex === index
                      }
                      onToggle={() => {
                        if (
                          openSection === "child" &&
                          openChildIndex === index
                        ) {
                          setOpenChildIndex(null);
                        } else {
                          setOpenSection("child");
                          setOpenChildIndex(index);
                        }
                      }}
                      hasError={Boolean(
                        errors.children?.[index],
                      )}
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
                          {tWizard("sections.removeChild")}
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
                setOpenSection("child");
                setOpenChildIndex(childFields.length);
              }}
              className="self-start text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              {tWizard("sections.addChild")}
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
          {tWizard("buttons.back")}
        </button>
        {!showSizePrompt ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? tWizard("buttons.saving") : resolvedSubmitLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}
