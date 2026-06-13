"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateRsvpStatus } from "@/app/actions/scheduling";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getServiceRoleLabelKey } from "@/lib/constants/service-roles";
import { formatDateShort } from "@/lib/format/datetime";
import { statusToBadgeVariant } from "@/lib/scheduling/status-ui";
import type { MemberAssignmentRow } from "@/lib/scheduling/types";
import type { ServiceAssignmentStatus } from "@/types/database";

type MemberPlanningTimelineProps = {
  assignments: MemberAssignmentRow[];
  labels: {
    empty: string;
    accept: string;
    decline: string;
    accepting: string;
    declining: string;
    declineTitle: string;
    declineDescription: string;
    declineReasonLabel: string;
    declineConfirm: string;
    cancel: string;
    error: string;
    roles: Record<string, string>;
    statuses: Record<ServiceAssignmentStatus, string>;
  };
};

export function MemberPlanningTimeline({
  assignments: initialAssignments,
  labels,
}: MemberPlanningTimelineProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState(initialAssignments);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  function updateLocalStatus(
    assignmentId: string,
    status: ServiceAssignmentStatus,
    declineReasonValue: string | null = null,
  ) {
    setAssignments((current) =>
      current.map((row) =>
        row.id === assignmentId
          ? { ...row, status, decline_reason: declineReasonValue }
          : row,
      ),
    );
  }

  function handleAccept(assignmentId: string) {
    setError(null);
    const previous = assignments.find((row) => row.id === assignmentId);
    if (!previous) return;

    updateLocalStatus(assignmentId, "accepted");

    startTransition(async () => {
      const result = await updateRsvpStatus({
        assignmentId,
        status: "accepted",
      });

      if (result.error) {
        updateLocalStatus(assignmentId, previous.status, previous.decline_reason);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleDeclineConfirm() {
    if (!declineTargetId) return;

    setError(null);
    const assignmentId = declineTargetId;
    const previous = assignments.find((row) => row.id === assignmentId);
    if (!previous) return;

    const reason = declineReason.trim() || null;
    updateLocalStatus(assignmentId, "declined", reason);
    setDeclineTargetId(null);
    setDeclineReason("");

    startTransition(async () => {
      const result = await updateRsvpStatus({
        assignmentId,
        status: "declined",
        reason: reason ?? undefined,
      });

      if (result.error) {
        updateLocalStatus(assignmentId, previous.status, previous.decline_reason);
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  if (assignments.length === 0) {
    return <p className="text-sm text-muted">{labels.empty}</p>;
  }

  return (
    <>
      {error ? (
        <p className="mb-4 text-sm font-medium text-status-error" role="alert">
          {error}
        </p>
      ) : null}

      <ol className="relative space-y-6 border-l border-border pl-6">
        {assignments.map((assignment) => (
          <li key={assignment.id} className="relative">
            <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    {formatDateShort(assignment.service.service_date)}
                  </p>
                  <p className="text-sm text-muted">
                    {assignment.service.title} —{" "}
                    {labels.roles[getServiceRoleLabelKey(assignment.role_code)]}
                  </p>
                </div>
                <Badge variant={statusToBadgeVariant(assignment.status)}>
                  {labels.statuses[assignment.status]}
                </Badge>
              </div>

              {assignment.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleAccept(assignment.id)}
                  >
                    {isPending ? labels.accepting : labels.accept}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => setDeclineTargetId(assignment.id)}
                  >
                    {isPending ? labels.declining : labels.decline}
                  </Button>
                </div>
              ) : null}

              {assignment.status === "declined" && assignment.decline_reason ? (
                <p className="mt-3 text-xs text-muted">{assignment.decline_reason}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      <Dialog
        open={declineTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeclineTargetId(null);
            setDeclineReason("");
          }
        }}
        title={labels.declineTitle}
        description={labels.declineDescription}
        confirmLabel={labels.declineConfirm}
        cancelLabel={labels.cancel}
        confirmVariant="danger"
        isConfirming={isPending}
        onConfirm={handleDeclineConfirm}
      >
        <label className="block text-sm font-medium text-gray-700">
          {labels.declineReasonLabel}
          <Textarea
            className="mt-2"
            rows={3}
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
          />
        </label>
      </Dialog>
    </>
  );
}
