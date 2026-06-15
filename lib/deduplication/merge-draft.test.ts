import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applySourceField,
  buildDefaultMergeDraft,
  collectBranchOptions,
} from "./merge-draft";
import type { DuplicatePersonSummary } from "./types";

function person(
  overrides: Partial<DuplicatePersonSummary> & Pick<DuplicatePersonSummary, "id">,
): DuplicatePersonSummary {
  return {
    firstName: "Jean",
    lastName: "Dupont",
    emails: [],
    phones: [],
    role: "autre",
    age: 30,
    householdId: "h1",
    householdName: "Foyer A",
    branches: [],
    isBaptized: false,
    isMpandray: false,
    isMpiandry: false,
    isMpamakyTeny: false,
    assignmentCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("buildDefaultMergeDraft", () => {
  it("merges email and phone lists from both profiles", () => {
    const master = person({
      id: "m",
      emails: [],
      phones: ["0321111111"],
      isMpamakyTeny: false,
    });
    const duplicate = person({
      id: "d",
      emails: ["dup@example.com"],
      phones: [],
      isMpamakyTeny: true,
      branches: [{ branch_code: "sampana_lahy", role: "Responsable" }],
    });

    const draft = buildDefaultMergeDraft(master, duplicate);

    assert.deepEqual(draft.emails, ["dup@example.com"]);
    assert.deepEqual(draft.phones, ["0321111111"]);
    assert.equal(draft.isMpamakyTeny, true);
    assert.deepEqual(draft.branches, [
      { branch_code: "sampana_lahy", role: "Responsable" },
    ]);
  });
});

describe("applySourceField", () => {
  it("copies duplicate emails into the draft", () => {
    const master = person({ id: "m", emails: ["master@example.com"] });
    const duplicate = person({ id: "d", emails: ["dup@example.com"] });
    const draft = buildDefaultMergeDraft(master, duplicate);

    const next = applySourceField(draft, "emails", "duplicate", master, duplicate);

    assert.deepEqual(next.emails, ["dup@example.com"]);
  });
});

describe("collectBranchOptions", () => {
  it("lists unique branch codes from both profiles", () => {
    const master = person({
      id: "m",
      branches: [{ branch_code: "vaomiera_technika", role: "PowerPoint" }],
    });
    const duplicate = person({
      id: "d",
      branches: [{ branch_code: "sampana_lahy", role: "Responsable" }],
    });

    const options = collectBranchOptions(master, duplicate);

    assert.equal(options.length, 2);
    assert.equal(options[0]!.branchCode, "sampana_lahy");
    assert.equal(options[1]!.masterRole, "PowerPoint");
  });
});
