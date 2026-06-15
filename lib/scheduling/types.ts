import type {
  Person,
  Service,
  ServiceAssignment,
  ServiceAssignmentStatus,
  ServiceRoleCode,
} from "@/types/database";

export type ServiceWithStatusCounts = Service & {
  statusCounts: {
    draft: number;
    pending: number;
    accepted: number;
    declined: number;
  };
};

export type ServiceAssignmentWithPerson = ServiceAssignment & {
  person: Person;
};

export type ServiceDetail = Service & {
  assignments: ServiceAssignmentWithPerson[];
};

export type MemberAssignmentRow = ServiceAssignment & {
  service: Pick<Service, "id" | "service_date" | "title">;
};

export type ReplaceVolunteerOption = {
  id: string;
  label: string;
};

export type GenerateScheduleResult = {
  createdServices: number;
  skippedServices: number;
  createdAssignments: number;
};

export type RecalculateDraftResult = {
  updatedServices: number;
  skippedServices: number;
  updatedAssignments: number;
};

export const RSVP_STATUSES = ["accepted", "declined"] as const satisfies readonly ServiceAssignmentStatus[];

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type AssignmentRoleCode = ServiceRoleCode;
