"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  getReplaceVolunteerOptions,
  recalculateDraftService,
  replaceAssignment,
  sendInvitations,
} from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getServiceRoleLabelKey } from "@/lib/constants/service-roles";
import { personDisplayName } from "@/lib/scheduling/volunteers";
import { statusToBadgeVariant } from "@/lib/scheduling/status-ui";
import type { ServiceDetail } from "@/lib/scheduling/types";
import type { ServiceAssignmentStatus } from "@/types/database";

type CulteAssignmentsTableProps = {
  detail: ServiceDetail;
  canRecalculate: boolean;
  isCancelled: boolean;
  labels: {
    person: string;
    role: string;
    status: string;
    declineReason: string;
    sendInvitations: string;
    sending: string;
    recalculateService: string;
    recalculatingService: string;
    recalculateServiceConfirm: string;
    recalculateServiceSuccess: string;
    replace: string;
    replacing: string;
    selectVolunteer: string;
    noVolunteers: string;
    roles: Record<string, string>;
    statuses: Record<ServiceAssignmentStatus, string>;
  };
};

export function CulteAssignmentsTable({
  detail,
  canRecalculate,
  isCancelled,
  labels,
}: CulteAssignmentsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [recalculateMessage, setRecalculateMessage] = useState<string | null>(null);
  const [recalculateError, setRecalculateError] = useState<string | null>(null);
  const [activeReplaceId, setActiveReplaceId] = useState<string | null>(null);
  const [optionsByAssignment, setOptionsByAssignment] = useState<
    Record<string, { id: string; label: string }[]>
  >({});
  const [selectedPersonId, setSelectedPersonId] = useState<string>("");

  const allDraft = detail.assignments.every(
    (assignment) => assignment.status === "draft",
  );

  function handleSendInvitations() {
    startTransition(async () => {
      await sendInvitations({ serviceId: detail.id });
      router.refresh();
    });
  }

  function handleRecalculateService() {
    if (!window.confirm(labels.recalculateServiceConfirm)) {
      return;
    }

    setRecalculateMessage(null);
    setRecalculateError(null);

    startTransition(async () => {
      const result = await recalculateDraftService({ serviceId: detail.id });
      if (result.error) {
        setRecalculateError(result.error);
        return;
      }

      setRecalculateMessage(labels.recalculateServiceSuccess);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!activeReplaceId) return;

    const assignment = detail.assignments.find((row) => row.id === activeReplaceId);
    if (!assignment) return;

    void getReplaceVolunteerOptions({
      serviceId: detail.id,
      roleCode: assignment.role_code,
    }).then((result) => {
      if (result.data) {
        setOptionsByAssignment((current) => ({
          ...current,
          [activeReplaceId]: result.data ?? [],
        }));
        setSelectedPersonId(result.data[0]?.id ?? "");
      }
    });
  }, [activeReplaceId, detail.assignments, detail.id]);

  function handleReplace(assignmentId: string) {
    if (!selectedPersonId) return;

    startTransition(async () => {
      await replaceAssignment({
        assignmentId,
        newPersonId: selectedPersonId,
      });
      setActiveReplaceId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {allDraft && !isCancelled ? (
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {canRecalculate ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleRecalculateService}
                disabled={isPending}
                size="sm"
              >
                {isPending ? labels.recalculatingService : labels.recalculateService}
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={handleSendInvitations}
              disabled={isPending}
              size="sm"
            >
              {isPending ? labels.sending : labels.sendInvitations}
            </Button>
          </div>
          {recalculateMessage ? (
            <Alert variant="success" className="max-w-md text-sm">
              {recalculateMessage}
            </Alert>
          ) : null}
          {recalculateError ? (
            <Alert variant="error" className="max-w-md text-sm">
              {recalculateError}
            </Alert>
          ) : null}
        </div>
      ) : null}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.person}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.role}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.status}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted">
                  {labels.replace}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {detail.assignments.map((assignment) => {
                const options = optionsByAssignment[assignment.id] ?? [];
                const isReplacing = activeReplaceId === assignment.id;

                return (
                  <tr key={assignment.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {personDisplayName(assignment.person)}
                      </p>
                      {assignment.status === "declined" &&
                      assignment.decline_reason ? (
                        <p className="mt-1 text-xs text-muted">
                          {labels.declineReason}: {assignment.decline_reason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {labels.roles[getServiceRoleLabelKey(assignment.role_code)]}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusToBadgeVariant(assignment.status)}>
                        {labels.statuses[assignment.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {assignment.status === "declined" ? (
                        isReplacing ? (
                          <div className="flex flex-col items-end gap-2">
                            {options.length > 0 ? (
                              <Select
                                value={selectedPersonId}
                                onChange={(event) =>
                                  setSelectedPersonId(event.target.value)
                                }
                                className="min-w-[12rem]"
                              >
                                {options.map((option) => (
                                  <option key={option.id} value={option.id}>
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                            ) : (
                              <p className="text-xs text-muted">
                                {labels.noVolunteers}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setActiveReplaceId(null)}
                              >
                                Annuler
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending || !selectedPersonId}
                                onClick={() => handleReplace(assignment.id)}
                              >
                                {isPending ? labels.replacing : labels.replace}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => setActiveReplaceId(assignment.id)}
                          >
                            {labels.replace}
                          </Button>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
