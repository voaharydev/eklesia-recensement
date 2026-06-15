"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SpiritualBadges } from "@/components/admin/spiritual-badges";
import {
  DuplicateMergeEditor,
  type DuplicateMergeEditorLabels,
} from "@/components/admin/duplicate-merge-editor";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { Select } from "@/components/ui/select";
import { formatBranchAssignmentDisplay } from "@/lib/branches/format-branch-role";
import {
  formatEmailsDisplay,
  formatPhonesDisplay,
  mergeEmailLists,
  mergePhoneLists,
} from "@/lib/contacts/person-contacts";
import { formatDateTimeShort } from "@/lib/format/datetime";
import type { DuplicateGroup, DuplicatePersonSummary } from "@/lib/deduplication/types";

export type DuplicateGroupCardLabels = {
  groupTitle: string;
  matchEmail: string;
  matchName: string;
  matchPhone: string;
  keepAsMaster: string;
  masterBadge: string;
  multiMergeHint: string;
  selectDuplicate: string;
  mergeEditor: DuplicateMergeEditorLabels;
  fields: {
    name: string;
    email: string;
    phone: string;
    household: string;
    role: string;
    age: string;
    branches: string;
    spiritual: string;
    assignments: string;
    createdAt: string;
    updatedAt: string;
  };
  spiritual: {
    baptized: string;
    mpandray: string;
    mpiandry: string;
    mpamakyTeny: string;
  };
  roleLabels: Record<string, string>;
};

type DuplicateGroupCardProps = {
  group: DuplicateGroup;
  labels: DuplicateGroupCardLabels;
  groupProgress?: string;
};

function scorePerson(person: DuplicatePersonSummary): number {
  let score = 0;
  if (person.emails.length > 0) score += 1;
  if (person.phones.length > 0) score += 1;
  score += person.branches.length;
  score += person.assignmentCount * 3;
  if (person.isMpamakyTeny) score += 2;
  if (person.isBaptized) score += 1;
  return score;
}

function pickDefaultMaster(persons: DuplicatePersonSummary[]): string {
  return persons.reduce((best, person) =>
    scorePerson(person) > scorePerson(best) ? person : best,
  ).id;
}

function pickDefaultDuplicate(
  persons: DuplicatePersonSummary[],
  masterId: string,
): string {
  return persons.find((person) => person.id !== masterId)?.id ?? persons[0]!.id;
}

function normalizeField(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value).trim().toLowerCase();
}

function branchesLabel(person: DuplicatePersonSummary): string {
  if (person.branches.length === 0) return "—";
  return person.branches
    .map((b) => formatBranchAssignmentDisplay(b.branch_code, b.role))
    .join(", ");
}

type CompareFieldProps = {
  label: string;
  value: string;
  differs: boolean;
};

function CompareField({ label, value, differs }: CompareFieldProps) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        differs
          ? "border-amber-300 bg-amber-50"
          : "border-border bg-surface-muted/40",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function matchTypeLabel(
  type: DuplicateGroup["matchTypes"][number],
  labels: DuplicateGroupCardLabels,
): string {
  if (type === "email") return labels.matchEmail;
  if (type === "name") return labels.matchName;
  return labels.matchPhone;
}

export function DuplicateGroupCard({ group, labels, groupProgress }: DuplicateGroupCardProps) {
  const [masterId, setMasterId] = useState(() => pickDefaultMaster(group.persons));
  const [duplicateId, setDuplicateId] = useState(() =>
    pickDefaultDuplicate(group.persons, pickDefaultMaster(group.persons)),
  );

  const master = useMemo(
    () => group.persons.find((p) => p.id === masterId) ?? group.persons[0]!,
    [group.persons, masterId],
  );

  const duplicate = useMemo(
    () =>
      group.persons.find((p) => p.id === duplicateId) ??
      group.persons.find((p) => p.id !== masterId) ??
      group.persons[0]!,
    [group.persons, duplicateId, masterId],
  );

  useEffect(() => {
    if (duplicateId === masterId) {
      setDuplicateId(pickDefaultDuplicate(group.persons, masterId));
    }
  }, [duplicateId, group.persons, masterId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {labels.groupTitle}
            </h2>
            {groupProgress ? (
              <p className="mt-1 text-sm text-muted">{groupProgress}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.matchTypes.map((type) => (
              <Badge key={type} variant="warning">
                {matchTypeLabel(type, labels)}
              </Badge>
            ))}
          </div>
        </div>
        {group.persons.length > 2 ? (
          <p className="mt-2 text-sm text-muted">{labels.multiMergeHint}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {group.persons.length > 2 ? (
          <div className="max-w-md">
            <label className="mb-1 block text-sm font-medium text-foreground">
              {labels.selectDuplicate}
            </label>
            <Select
              value={duplicateId}
              onChange={(event) => setDuplicateId(event.target.value)}
            >
              {group.persons
                .filter((person) => person.id !== masterId)
                .map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.lastName} {person.firstName} — {person.householdName}
                  </option>
                ))}
            </Select>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          {group.persons.map((person) => {
            const isMaster = person.id === masterId;
            const isDuplicate = person.id === duplicate.id;
            const roleLabel =
              labels.roleLabels[person.role] ?? person.role;

            return (
              <div
                key={person.id}
                className={cn(
                  "rounded-xl border p-4",
                  isMaster
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : isDuplicate
                      ? "border-amber-300/70 bg-amber-50/40"
                      : "border-border bg-surface",
                )}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="radio"
                      name={`master-${group.id}`}
                      checked={isMaster}
                      onChange={() => setMasterId(person.id)}
                      className="size-4 accent-primary"
                    />
                    {labels.keepAsMaster}
                  </label>
                  {isMaster ? (
                    <Badge variant="success">{labels.masterBadge}</Badge>
                  ) : null}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <CompareField
                    label={labels.fields.name}
                    value={`${person.firstName} ${person.lastName}`}
                    differs={
                      normalizeField(person.firstName) !==
                        normalizeField(master.firstName) ||
                      normalizeField(person.lastName) !==
                        normalizeField(master.lastName)
                    }
                  />
                  <CompareField
                    label={labels.fields.email}
                    value={formatEmailsDisplay(person.emails)}
                    differs={
                      JSON.stringify(mergeEmailLists(master.emails, [])) !==
                      JSON.stringify(mergeEmailLists(person.emails, []))
                    }
                  />
                  <CompareField
                    label={labels.fields.phone}
                    value={formatPhonesDisplay(person.phones)}
                    differs={
                      JSON.stringify(mergePhoneLists(master.phones, [])) !==
                      JSON.stringify(mergePhoneLists(person.phones, []))
                    }
                  />
                  <CompareField
                    label={labels.fields.household}
                    value={person.householdName}
                    differs={person.householdId !== master.householdId}
                  />
                  <CompareField
                    label={labels.fields.role}
                    value={roleLabel}
                    differs={person.role !== master.role}
                  />
                  <CompareField
                    label={labels.fields.age}
                    value={
                      person.age != null ? String(person.age) : "—"
                    }
                    differs={person.age !== master.age}
                  />
                  <CompareField
                    label={labels.fields.assignments}
                    value={String(person.assignmentCount)}
                    differs={
                      person.assignmentCount !== master.assignmentCount
                    }
                  />
                  <CompareField
                    label={labels.fields.createdAt}
                    value={formatDateTimeShort(person.createdAt)}
                    differs={person.createdAt !== master.createdAt}
                  />
                  <CompareField
                    label={labels.fields.updatedAt}
                    value={formatDateTimeShort(person.updatedAt)}
                    differs={person.updatedAt !== master.updatedAt}
                  />
                  <div
                    className={cn(
                      "rounded-md border px-3 py-2 sm:col-span-2",
                      branchesLabel(person) !== branchesLabel(master)
                        ? "border-amber-300 bg-amber-50"
                        : "border-border bg-surface-muted/40",
                    )}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {labels.fields.branches}
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {branchesLabel(person)}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-md border px-3 py-2 sm:col-span-2",
                      person.isBaptized !== master.isBaptized ||
                        person.isMpandray !== master.isMpandray ||
                        person.isMpiandry !== master.isMpiandry ||
                        person.isMpamakyTeny !== master.isMpamakyTeny
                        ? "border-amber-300 bg-amber-50"
                        : "border-border bg-surface-muted/40",
                    )}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {labels.fields.spiritual}
                    </p>
                    <div className="mt-1">
                      <SpiritualBadges
                        person={{
                          is_baptized: person.isBaptized,
                          is_mpandray: person.isMpandray,
                          is_mpiandry: person.isMpiandry,
                          is_mpamaky_teny: person.isMpamakyTeny,
                        }}
                        labels={labels.spiritual}
                      />
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-muted">
                  <Link
                    href={`/admin/households/${person.householdId}`}
                    className="underline hover:text-foreground"
                  >
                    {labels.fields.household}
                  </Link>
                </p>
              </div>
            );
          })}
        </div>

        {master.id !== duplicate.id ? (
          <DuplicateMergeEditor
            key={`${master.id}:${duplicate.id}`}
            master={master}
            duplicate={duplicate}
            labels={labels.mergeEditor}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
