import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mergePersonBranches } from "./merge-branches";

describe("mergePersonBranches", () => {
  it("keeps master branch roles when both have the same branch", () => {
    const merged = mergePersonBranches(
      [{ branch_code: "vaomiera_technika", role: "PowerPoint" }],
      [{ branch_code: "vaomiera_technika", role: "Son" }],
    );

    assert.deepEqual(merged, [
      { branch_code: "vaomiera_technika", role: "PowerPoint" },
    ]);
  });

  it("adds duplicate-only branches to the master", () => {
    const merged = mergePersonBranches(
      [{ branch_code: "vaomiera_technika", role: "PowerPoint" }],
      [{ branch_code: "sampana_lahy", role: "Responsable" }],
    );

    assert.deepEqual(merged, [
      { branch_code: "sampana_lahy", role: "Responsable" },
      { branch_code: "vaomiera_technika", role: "PowerPoint" },
    ]);
  });
});
