"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";

import { HouseholdChildFields } from "@/components/registration/household-child-fields";
import { HouseholdRoleSelect } from "@/components/registration/household-role-select";
import { HouseholdSizePrompt } from "@/components/registration/household-size-prompt";
import { MemberAdultFields } from "@/components/registration/member-adult-fields";
import { MemberChurchFields } from "@/components/registration/member-church-fields";
import {
  PersonFormTabs,
  type PersonFormTab,
} from "@/components/registration/person-form-tabs";
import { PersonAccordionCard } from "@/components/registration/person-accordion-card";
import {
  PersonQuickNav,
  type PersonNavItem,
} from "@/components/registration/person-quick-nav";
import { SectionLabel } from "@/components/registration/section-label";
import { WizardActionBar } from "@/components/registration/wizard-action-bar";
import { Button } from "@/components/ui/button";
import type { AdultFormHouseholdRole } from "@/lib/constants/person-roles";
import {
  canDemoteHead,
  swapAdultWithHead,
} from "@/lib/registration/household-role";
import { isSpouseFilled } from "@/lib/registration/spouse";
import {
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
  type MemberFieldPrefix,
} from "@/lib/registration/person-form-ui";
import { formatDateTimeShort } from "@/lib/format/datetime";
import { useRegistrationSchemas } from "@/lib/i18n/client";
import type { PersonTimestampsMap } from "@/lib/registration/person-timestamps";
import {
  defaultChild,
  defaultMember,
  type BranchAssignmentFormValues,
  type HouseholdPersonsFormValues,
} from "@/lib/validations/registration";

type MembersStepProps = {
  defaultValues: HouseholdPersonsFormValues;
  isEditMode?: boolean;
  submitLabel?: string;
  onSubmit: (values: HouseholdPersonsFormValues) => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
  personTimestamps?: PersonTimestampsMap;
};

function cloneBranches(
  branches: BranchAssignmentFormValues[] | undefined,
): BranchAssignmentFormValues[] {
  return (branches ?? []).map((b) => ({
    branch_code: b.branch_code,
    role: b.role ?? "",
  }));
}

export function MembersStep({
  defaultValues,
  isEditMode = false,
  submitLabel,
  onSubmit,
  onBack,
  isSubmitting,
  personTimestamps,
}: MembersStepProps) {
  const tWizard = useTranslations("wizard");
  const tForm = useTranslations("form.person");

  function renderPersonMeta(personId: string | undefined) {
    if (!personId || !personTimestamps) return null;
    const timestamps = personTimestamps[personId];
    if (!timestamps) return null;

    return (
      <>
        {tForm("createdAt")}: {formatDateTimeShort(timestamps.createdAt)}
        {" · "}
        {tForm("updatedAt")}: {formatDateTimeShort(timestamps.updatedAt)}
      </>
    );
  }
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
  const [personTabs, setPersonTabs] = useState<Record<string, PersonFormTab>>(
    {},
  );
  const [headDemoteMessage, setHeadDemoteMessage] = useState<string | null>(
    null,
  );

  const [sizePromptDone, setSizePromptDone] = useState(
    isEditMode ||
      initialHasSpouse ||
      defaultValues.otherAdults.length > 0 ||
      defaultValues.children.length > 0,
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
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
    setPersonTabs({});
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

  const adultCount =
    1 + (hasSpouse ? 1 : 0) + otherAdultFields.length;
  const childCount = childFields.length;

  function getPersonTab(key: string): PersonFormTab {
    return personTabs[key] ?? "identity";
  }

  function setPersonTab(key: string, tab: PersonFormTab) {
    setPersonTabs((prev) => ({ ...prev, [key]: tab }));
  }

  const switchToChurchTab = useCallback((key: string) => {
    setPersonTabs((prev) => ({ ...prev, [key]: "church" }));
  }, []);

  useEffect(() => {
    if (submitCount === 0) return;
    if (adultHasChurchErrors(errors, "head")) {
      switchToChurchTab("head");
    }
    if (hasSpouse && adultHasChurchErrors(errors, "spouse")) {
      switchToChurchTab("spouse");
    }
    otherAdultFields.forEach((_, index) => {
      if (otherAdultHasChurchErrors(errors, index)) {
        switchToChurchTab(`otherAdults.${index}`);
      }
    });
  }, [errors, submitCount, hasSpouse, otherAdultFields, switchToChurchTab]);

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

  function applyHouseholdPersonsSnapshot(
    snapshot: HouseholdPersonsFormValues,
  ): void {
    setValue("head", snapshot.head);
    setValue("spouse", snapshot.spouse);
    setValue("otherAdults", snapshot.otherAdults);
  }

  function promoteSpouseToHead(): void {
    const updated = swapAdultWithHead(getValues(), "spouse");
    applyHouseholdPersonsSnapshot(updated);
    setHasSpouse(true);
    setHeadDemoteMessage(null);
    setOpenSection("head");
  }

  function promoteOtherToHead(index: number): void {
    const updated = swapAdultWithHead(getValues(), index);
    applyHouseholdPersonsSnapshot(updated);
    setHeadDemoteMessage(null);
    setOpenSection("head");
  }

  function handleHeadRoleChange(role: AdultFormHouseholdRole): void {
    if (role === "chef_de_famille") {
      setHeadDemoteMessage(null);
      return;
    }
    if (!canDemoteHead(getValues())) {
      setValue("head.household_role", "chef_de_famille");
      setHeadDemoteMessage(tForm("cannotDemoteHead"));
    } else {
      setHeadDemoteMessage(null);
    }
  }

  function handleSpouseRoleChange(role: AdultFormHouseholdRole): void {
    if (role === "chef_de_famille") {
      promoteSpouseToHead();
    }
  }

  function handleOtherAdultRoleChange(
    index: number,
    role: AdultFormHouseholdRole,
  ): void {
    if (role === "chef_de_famille") {
      promoteOtherToHead(index);
    }
  }

  function enableSpouse() {
    setHasSpouse(true);
    if (!isSpouseFilled(watchedValues.spouse)) {
      setValue("spouse", {
        ...defaultMember,
        last_name: watchedValues.head?.last_name ?? "",
        email: "",
        phone: "",
        household_role: "conjoint",
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

  function applyHeadBranchesToAll() {
    const cloned = cloneBranches(getValues("head.branches"));
    if (hasSpouse) {
      setValue("spouse.branches", cloned);
    }
    otherAdultFields.forEach((_, index) => {
      setValue(`otherAdults.${index}.branches`, cloned);
    });
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
          switchToChurchTab("head");
        }
      } else if (first.kind === "spouse") {
        setOpenSection("spouse");
        if (adultHasChurchErrors(formErrors, "spouse")) {
          switchToChurchTab("spouse");
        }
      } else if (first.kind === "otherAdult" && first.index != null) {
        setOpenSection("otherAdult");
        setOpenOtherAdultIndex(first.index);
        if (otherAdultHasChurchErrors(formErrors, first.index)) {
          switchToChurchTab(`otherAdults.${first.index}`);
        }
      } else if (first.kind === "child" && first.index != null) {
        setOpenSection("child");
        setOpenChildIndex(first.index);
      }
    },
    [hasSpouse, otherAdultFields.length, switchToChurchTab],
  );

  function renderAdultForm(
    fieldPrefix: MemberFieldPrefix,
    tabKey: string,
    options?: {
      isHead?: boolean;
      showPromoteButton?: boolean;
      onPromoteToHead?: () => void;
      onRoleChange?: (role: AdultFormHouseholdRole) => void;
      demoteBlockedMessage?: string | null;
      showApplyBranches?: boolean;
    },
  ) {
    const churchHasError =
      fieldPrefix === "head"
        ? adultHasChurchErrors(errors, "head")
        : fieldPrefix === "spouse"
          ? adultHasChurchErrors(errors, "spouse")
          : otherAdultHasChurchErrors(
              errors,
              Number(fieldPrefix.replace("otherAdults.", "")),
            );

    return (
      <div className="flex flex-col gap-4">
        <HouseholdRoleSelect
          fieldPrefix={fieldPrefix}
          register={register}
          errors={errors}
          isHead={options?.isHead}
          showPromoteButton={options?.showPromoteButton}
          onPromoteToHead={options?.onPromoteToHead}
          onRoleChange={options?.onRoleChange}
          demoteBlockedMessage={options?.demoteBlockedMessage}
        />
        <PersonFormTabs
          activeTab={getPersonTab(tabKey)}
          onTabChange={(tab) => setPersonTab(tabKey, tab)}
          identityLabel={tWizard("tabs.identity")}
          churchLabel={tWizard("tabs.church")}
          churchHasError={churchHasError}
          identityContent={
            <MemberAdultFields
              fieldPrefix={fieldPrefix}
              control={control}
              register={register}
              errors={errors}
            />
          }
          churchContent={
            <MemberChurchFields
              fieldPrefix={fieldPrefix}
              control={control}
              register={register}
              watch={watch}
              errors={errors}
            />
          }
          churchFooter={
            options?.showApplyBranches ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-4 self-start"
                onClick={applyHeadBranchesToAll}
              >
                {tWizard("shortcuts.applyBranches")}
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const showSizePrompt = !isEditMode && !sizePromptDone;

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-6"
      noValidate
    >
      {showSizePrompt ? (
        <HouseholdSizePrompt onApply={handleApplyHouseholdSize} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm">
            <span className="text-foreground">
              {tWizard("householdContext", {
                adults: adultCount,
                children: childCount,
              })}
            </span>
            {!isEditMode ? (
              <button
                type="button"
                onClick={() => setSizePromptDone(false)}
                className="font-medium text-primary hover:text-primary-hover focus-ring rounded"
              >
                {tWizard("editHouseholdSize")}
              </button>
            ) : null}
          </div>

          <PersonQuickNav items={navItems} onSelect={handleNavSelect} />

          <div className="flex flex-col gap-3">
            <SectionLabel>{tWizard("sections.headTitle")}</SectionLabel>

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
              meta={renderPersonMeta(watchedValues.head?.id)}
            >
              {watchedValues.head?.id ? (
                <input type="hidden" {...register("head.id")} />
              ) : null}
              {renderAdultForm("head", "head", {
                isHead: true,
                onRoleChange: handleHeadRoleChange,
                demoteBlockedMessage: headDemoteMessage,
                showApplyBranches: true,
              })}
            </PersonAccordionCard>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>{tWizard("sections.spouseTitle")}</SectionLabel>

            {hasSpouse ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={applyLastNameToSpouse}
                  >
                    {tWizard("shortcuts.sameLastName")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={disableSpouse}
                    className="text-status-error hover:bg-status-error/5"
                  >
                    {tWizard("sections.removeSpouse")}
                  </Button>
                </div>

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
                  meta={renderPersonMeta(watchedValues.spouse?.id)}
                >
                  {watchedValues.spouse?.id ? (
                    <input type="hidden" {...register("spouse.id")} />
                  ) : null}
                  {renderAdultForm("spouse", "spouse", {
                    showPromoteButton: true,
                    onPromoteToHead: promoteSpouseToHead,
                    onRoleChange: handleSpouseRoleChange,
                  })}
                </PersonAccordionCard>
              </>
            ) : (
              <Button type="button" variant="ghost" onClick={enableSpouse}>
                {tWizard("sections.addSpouse")}
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>{tWizard("sections.otherAdultsTitle")}</SectionLabel>

            {otherAdultFields.length === 0 ? (
              <p className="text-sm text-muted">
                {tWizard("sections.noOtherAdults")}
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {otherAdultFields.map((field, index) => {
                  const adult = watchedValues.otherAdults?.[index];
                  const fieldPrefix = `otherAdults.${index}` as const;
                  const tabKey = fieldPrefix;

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
                      meta={renderPersonMeta(adult?.id)}
                    >
                      {adult?.id ? (
                        <input
                          type="hidden"
                          {...register(`otherAdults.${index}.id`)}
                        />
                      ) : null}
                      <div className="flex flex-col gap-4">
                        {renderAdultForm(fieldPrefix, tabKey, {
                          showPromoteButton: true,
                          onPromoteToHead: () => promoteOtherToHead(index),
                          onRoleChange: (role) =>
                            handleOtherAdultRoleChange(index, role),
                        })}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-start text-status-error hover:bg-status-error/5"
                          onClick={() => {
                            removeOtherAdult(index);
                            if (openOtherAdultIndex === index) {
                              setOpenOtherAdultIndex(null);
                            }
                          }}
                        >
                          {tWizard("sections.removeOtherAdult")}
                        </Button>
                      </div>
                    </PersonAccordionCard>
                  );
                })}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                appendOtherAdult({
                  ...defaultMember,
                  email: "",
                  phone: "",
                  household_role: "autre",
                });
                setOpenSection("otherAdult");
                setOpenOtherAdultIndex(otherAdultFields.length);
              }}
            >
              {tWizard("sections.addOtherAdult")}
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <SectionLabel>{tWizard("sections.childrenTitle")}</SectionLabel>

            {childFields.length === 0 ? (
              <p className="text-sm text-muted">
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
                      hasError={Boolean(errors.children?.[index])}
                      isComplete={isChildComplete(child)}
                      variant="child"
                      meta={renderPersonMeta(child?.id)}
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-start text-status-error hover:bg-status-error/5"
                          onClick={() => {
                            removeChild(index);
                            if (openChildIndex === index) {
                              setOpenChildIndex(null);
                            }
                          }}
                        >
                          {tWizard("sections.removeChild")}
                        </Button>
                      </div>
                    </PersonAccordionCard>
                  );
                })}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                appendChild(defaultChild);
                setOpenSection("child");
                setOpenChildIndex(childFields.length);
              }}
            >
              {tWizard("sections.addChild")}
            </Button>
          </div>
        </>
      )}

      <WizardActionBar
        onBack={onBack}
        backLabel={tWizard("buttons.back")}
        submitLabel={resolvedSubmitLabel}
        submittingLabel={tWizard("buttons.saving")}
        isSubmitting={isSubmitting}
        showSubmit={!showSizePrompt}
        showBack={!showSizePrompt}
      />
    </form>
  );
}
