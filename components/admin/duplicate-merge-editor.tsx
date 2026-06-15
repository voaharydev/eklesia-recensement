"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { mergePersons } from "@/app/actions/deduplication";
import { ContactListField } from "@/components/shared/contact-list-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/components/ui/cn";
import {
  mergeEmailLists,
  mergePhoneLists,
} from "@/lib/contacts/person-contacts";
import { getBranchLabel } from "@/lib/constants/branches";
import { FORM_HOUSEHOLD_ROLES } from "@/lib/constants/person-roles";
import { formatBranchRoleDisplay } from "@/lib/branches/format-branch-role";
import {
  applySourceField,
  buildDefaultMergeDraft,
  collectBranchOptions,
  isBranchIncluded,
  setBranchRoleFromSource,
  toggleBranchInDraft,
  type MergeDraftScalarField,
  type MergeProfileDraft,
} from "@/lib/deduplication/merge-draft";
import type { DuplicatePersonSummary } from "@/lib/deduplication/types";

export type DuplicateMergeEditorLabels = {
  title: string;
  confirmMerge: string;
  merging: string;
  mergeConfirm: string;
  mergeSuccess: string;
  useMasterValue: string;
  useDuplicateValue: string;
  masterRoleBranch: string;
  duplicateRoleBranch: string;
  includeBranch: string;
  assignmentsTransferred: string;
  householdKept: string;
  fields: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    age: string;
    branches: string;
    spiritual: string;
  };
  spiritual: {
    baptized: string;
    mpandray: string;
    mpiandry: string;
    mpamakyTeny: string;
  };
  roleLabels: Record<string, string>;
};

type DuplicateMergeEditorProps = {
  master: DuplicatePersonSummary;
  duplicate: DuplicatePersonSummary;
  labels: DuplicateMergeEditorLabels;
};

type FieldRowProps = {
  label: string;
  children: ReactNode;
  onUseMaster: () => void;
  onUseDuplicate: () => void;
  masterLabel: string;
  duplicateLabel: string;
  differs?: boolean;
};

function FieldRow({
  label,
  children,
  onUseMaster,
  onUseDuplicate,
  masterLabel,
  duplicateLabel,
  differs = false,
}: FieldRowProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        differs ? "border-amber-300 bg-amber-50/60" : "border-border",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="secondary" onClick={onUseMaster}>
            {masterLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onUseDuplicate}
          >
            {duplicateLabel}
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function normalizeCompare(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function DuplicateMergeEditor({
  master,
  duplicate,
  labels,
}: DuplicateMergeEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<MergeProfileDraft>(() =>
    buildDefaultMergeDraft(master, duplicate),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const branchOptions = useMemo(
    () => collectBranchOptions(master, duplicate),
    [master, duplicate],
  );

  useEffect(() => {
    setDraft(buildDefaultMergeDraft(master, duplicate));
    setError(null);
    setSuccess(null);
  }, [master, duplicate]);

  function applyField(field: MergeDraftScalarField, source: "master" | "duplicate") {
    setDraft((current) => applySourceField(current, field, source, master, duplicate));
  }

  function handleConfirmMerge() {
    if (!window.confirm(labels.mergeConfirm)) {
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await mergePersons({
        masterPersonId: master.id,
        duplicatePersonId: duplicate.id,
        patch: draft,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(labels.mergeSuccess);
      router.refresh();
    });
  }

  const transferredAssignments =
    master.assignmentCount + duplicate.assignmentCount;

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <h3 className="text-base font-semibold text-foreground">{labels.title}</h3>

      <div className="mt-3 space-y-2 text-sm text-muted">
        <p>
          {labels.householdKept}: <strong>{master.householdName}</strong>
        </p>
        <p>
          {labels.assignmentsTransferred}:{" "}
          <strong>{transferredAssignments}</strong>
        </p>
      </div>

      {error ? (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success" className="mt-4">
          {success}
        </Alert>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <FieldRow
          label={labels.fields.firstName}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={
            normalizeCompare(master.firstName) !==
            normalizeCompare(duplicate.firstName)
          }
          onUseMaster={() => applyField("firstName", "master")}
          onUseDuplicate={() => applyField("firstName", "duplicate")}
        >
          <Input
            value={draft.firstName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                firstName: event.target.value,
              }))
            }
          />
        </FieldRow>

        <FieldRow
          label={labels.fields.lastName}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={
            normalizeCompare(master.lastName) !==
            normalizeCompare(duplicate.lastName)
          }
          onUseMaster={() => applyField("lastName", "master")}
          onUseDuplicate={() => applyField("lastName", "duplicate")}
        >
          <Input
            value={draft.lastName}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                lastName: event.target.value,
              }))
            }
          />
        </FieldRow>

        <FieldRow
          label={labels.fields.email}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={
            JSON.stringify(mergeEmailLists(master.emails, [])) !==
            JSON.stringify(mergeEmailLists(duplicate.emails, []))
          }
          onUseMaster={() => applyField("emails", "master")}
          onUseDuplicate={() => applyField("emails", "duplicate")}
        >
          <ContactListField
            label=""
            type="email"
            values={draft.emails}
            onChange={(emails) =>
              setDraft((current) => ({ ...current, emails }))
            }
            addLabel={labels.fields.email}
            removeLabel="−"
          />
        </FieldRow>

        <FieldRow
          label={labels.fields.phone}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={
            JSON.stringify(mergePhoneLists(master.phones, [])) !==
            JSON.stringify(mergePhoneLists(duplicate.phones, []))
          }
          onUseMaster={() => applyField("phones", "master")}
          onUseDuplicate={() => applyField("phones", "duplicate")}
        >
          <ContactListField
            label=""
            type="tel"
            values={draft.phones}
            onChange={(phones) =>
              setDraft((current) => ({ ...current, phones }))
            }
            addLabel={labels.fields.phone}
            removeLabel="−"
          />
        </FieldRow>

        <FieldRow
          label={labels.fields.role}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={master.role !== duplicate.role}
          onUseMaster={() => applyField("role", "master")}
          onUseDuplicate={() => applyField("role", "duplicate")}
        >
          <Select
            value={draft.role}
            onChange={(event) =>
              setDraft((current) => ({ ...current, role: event.target.value }))
            }
          >
            {FORM_HOUSEHOLD_ROLES.map((role) => (
              <option key={role} value={role}>
                {labels.roleLabels[role] ?? role}
              </option>
            ))}
          </Select>
        </FieldRow>

        <FieldRow
          label={labels.fields.age}
          masterLabel={labels.useMasterValue}
          duplicateLabel={labels.useDuplicateValue}
          differs={master.age !== duplicate.age}
          onUseMaster={() => applyField("age", "master")}
          onUseDuplicate={() => applyField("age", "duplicate")}
        >
          <Input
            inputMode="numeric"
            value={draft.age}
            onChange={(event) =>
              setDraft((current) => ({ ...current, age: event.target.value }))
            }
          />
        </FieldRow>
      </div>

      <div className="mt-4 rounded-md border border-border p-3">
        <p className="mb-3 text-sm font-medium text-foreground">
          {labels.fields.spiritual}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["isBaptized", labels.spiritual.baptized],
              ["isMpandray", labels.spiritual.mpandray],
              ["isMpiandry", labels.spiritual.mpiandry],
              ["isMpamakyTeny", labels.spiritual.mpamakyTeny],
            ] as const
          ).map(([field, fieldLabel]) => (
            <label
              key={field}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={draft[field]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [field]: event.target.checked,
                  }))
                }
              />
              {fieldLabel}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border p-3">
        <p className="mb-3 text-sm font-medium text-foreground">
          {labels.fields.branches}
        </p>
        <div className="space-y-3">
          {branchOptions.length === 0 ? (
            <p className="text-sm text-muted">—</p>
          ) : (
            branchOptions.map((option) => {
              const included = isBranchIncluded(draft, option.branchCode);
              const rolesDiffer =
                normalizeCompare(option.masterRole) !==
                normalizeCompare(option.duplicateRole);

              return (
                <div
                  key={option.branchCode}
                  className="rounded-md border border-border bg-surface px-3 py-2"
                >
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={included}
                      onChange={(event) =>
                        setDraft((current) =>
                          toggleBranchInDraft(
                            current,
                            option,
                            event.target.checked,
                            "master",
                          ),
                        )
                      }
                    />
                    {getBranchLabel(option.branchCode)}
                  </label>
                  {included ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>
                        {formatBranchRoleDisplay(
                          option.branchCode,
                          draft.branches.find(
                            (b) => b.branch_code === option.branchCode,
                          )?.role,
                        ) || "—"}
                      </span>
                      {rolesDiffer ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setDraft((current) =>
                                setBranchRoleFromSource(current, option, "master"),
                              )
                            }
                          >
                            {labels.masterRoleBranch}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setDraft((current) =>
                                setBranchRoleFromSource(
                                  current,
                                  option,
                                  "duplicate",
                                ),
                              )
                            }
                          >
                            {labels.duplicateRoleBranch}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted">{labels.includeBranch}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" disabled={isPending} onClick={handleConfirmMerge}>
          {isPending ? labels.merging : labels.confirmMerge}
        </Button>
      </div>
    </div>
  );
}
