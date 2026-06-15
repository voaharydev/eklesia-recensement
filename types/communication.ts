export type CommunicationChannel = "email" | "sms";

export type SpiritualFilter =
  | "mpandray"
  | "mpiandry"
  | "sefala"
  | "baptized"
  | "mpamaky_teny";

export type CommunicationFilters = {
  ageMin?: number;
  ageMax?: number;
  branch?: string;
  branchRole?: string;
  spiritual?: SpiritualFilter;
  householdId?: string;
  channel?: CommunicationChannel;
};

export type TargetedMember = {
  id: string;
  firstName: string;
  lastName: string;
  emails: string[];
  phones: string[];
  householdName: string;
};

export type HouseholdSearchResult = {
  id: string;
  name: string;
};
