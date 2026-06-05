import type { ImportPersonDraft } from "@/lib/import/types";

export type GroupedHousehold = {
  householdKey: string;
  name: string;
  mainAddress: string;
  landlinePhone: string | null;
  arrivalDateFjkm: string | null;
  persons: ImportPersonDraft[];
};

export function groupDraftsByHousehold(
  drafts: ImportPersonDraft[],
): GroupedHousehold[] {
  const map = new Map<string, GroupedHousehold>();

  for (const draft of drafts) {
    let group = map.get(draft.householdKey);
    if (!group) {
      group = {
        householdKey: draft.householdKey,
        name: draft.householdName,
        mainAddress: draft.mainAddress,
        landlinePhone: draft.landlinePhone,
        arrivalDateFjkm: draft.arrivalDateFjkm,
        persons: [],
      };
      map.set(draft.householdKey, group);
    }

    if (!group.landlinePhone && draft.landlinePhone) {
      group.landlinePhone = draft.landlinePhone;
    }
    if (!group.arrivalDateFjkm && draft.arrivalDateFjkm) {
      group.arrivalDateFjkm = draft.arrivalDateFjkm;
    }

    group.persons.push(draft);
  }

  return Array.from(map.values());
}
