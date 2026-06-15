import type { PersonBranchAssignment } from "@/types/database";

export type DuplicateMatchType = "email" | "name" | "phone";

export type DuplicateBucket = {
  matchType: DuplicateMatchType;
  matchKey: string;
  personIds: string[];
};

export type DuplicatePersonSummary = {
  id: string;
  firstName: string;
  lastName: string;
  emails: string[];
  phones: string[];
  role: string;
  age: number | null;
  householdId: string;
  householdName: string;
  branches: PersonBranchAssignment[];
  isBaptized: boolean;
  isMpandray: boolean;
  isMpiandry: boolean;
  isSefala: boolean;
  isMpamakyTeny: boolean;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DuplicateGroup = {
  id: string;
  matchTypes: DuplicateMatchType[];
  persons: DuplicatePersonSummary[];
};
