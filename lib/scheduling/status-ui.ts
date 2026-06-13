import type { BadgeVariant } from "@/components/ui/badge";
import type { ServiceAssignmentStatus } from "@/types/database";

export function statusToBadgeVariant(
  status: ServiceAssignmentStatus,
): BadgeVariant {
  switch (status) {
    case "draft":
      return "default";
    case "pending":
      return "warning";
    case "accepted":
      return "success";
    case "declined":
      return "error";
    default:
      return "default";
  }
}

export type StatusCounts = {
  draft: number;
  pending: number;
  accepted: number;
  declined: number;
};

export function countByStatus(
  statuses: ServiceAssignmentStatus[],
): StatusCounts {
  return statuses.reduce<StatusCounts>(
    (acc, status) => {
      acc[status] += 1;
      return acc;
    },
    { draft: 0, pending: 0, accepted: 0, declined: 0 },
  );
}

export function allAssignmentsDraft(statuses: ServiceAssignmentStatus[]): boolean {
  return statuses.length > 0 && statuses.every((status) => status === "draft");
}

export function hasNonDraftAssignment(
  statuses: ServiceAssignmentStatus[],
): boolean {
  return statuses.some((status) => status !== "draft");
}
