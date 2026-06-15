import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyCommunicationPostFilters,
  collectEmailsForCopy,
  collectPhonesForCopy,
  type CommunicationPersonRow,
} from "@/lib/communication/filter-targeted-members";

function makeRow(
  overrides: Partial<CommunicationPersonRow> & { id: string },
): CommunicationPersonRow {
  return {
    id: overrides.id,
    first_name: overrides.first_name ?? "Jean",
    last_name: overrides.last_name ?? "Rakoto",
    emails: overrides.emails ?? ["jean@example.com"],
    phones: overrides.phones ?? ["0320000000"],
    branches: overrides.branches ?? [],
    household: overrides.household ?? { name: "Foyer Rakoto" },
  };
}

describe("applyCommunicationPostFilters", () => {
  const rows = [
    makeRow({
      id: "1",
      emails: ["a@example.com"],
      phones: [],
      branches: [
        {
          branch_code: "vaomiera_technika",
          role: "PowerPoint",
        },
      ],
    }),
    makeRow({
      id: "2",
      emails: [],
      phones: ["0341111111"],
      branches: [{ branch_code: "aff", role: "Responsable" }],
    }),
    makeRow({
      id: "3",
      emails: ["c@example.com"],
      phones: ["0342222222"],
      branches: [{ branch_code: "aff", role: "Membre actif" }],
    }),
  ];

  it("keeps members with emails in email channel mode", () => {
    const result = applyCommunicationPostFilters(rows, { channel: "email" });
    assert.deepEqual(result.map((row) => row.id), ["1", "3"]);
  });

  it("keeps members with phones in sms channel mode", () => {
    const result = applyCommunicationPostFilters(rows, { channel: "sms" });
    assert.deepEqual(result.map((row) => row.id), ["2", "3"]);
  });

  it("filters by branch role preset", () => {
    const result = applyCommunicationPostFilters(rows, {
      channel: "email",
      branchRole: "powerpoint",
    });
    assert.deepEqual(result.map((row) => row.id), ["1"]);
  });
});

describe("collectEmailsForCopy", () => {
  it("deduplicates emails across members", () => {
    const emails = collectEmailsForCopy([
      {
        id: "1",
        firstName: "A",
        lastName: "B",
        emails: ["dup@example.com", "Other@example.com"],
        phones: [],
        householdName: "F1",
      },
      {
        id: "2",
        firstName: "C",
        lastName: "D",
        emails: ["dup@example.com"],
        phones: [],
        householdName: "F2",
      },
    ]);

    assert.deepEqual(emails, ["dup@example.com", "other@example.com"]);
  });
});

describe("collectPhonesForCopy", () => {
  it("deduplicates phone numbers", () => {
    const phones = collectPhonesForCopy([
      {
        id: "1",
        firstName: "A",
        lastName: "B",
        emails: [],
        phones: ["0321111111", "0342222222"],
        householdName: "F1",
      },
      {
        id: "2",
        firstName: "C",
        lastName: "D",
        emails: [],
        phones: ["0321111111"],
        householdName: "F2",
      },
    ]);

    assert.deepEqual(phones, ["0321111111", "0342222222"]);
  });
});
