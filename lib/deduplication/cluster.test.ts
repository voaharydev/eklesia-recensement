import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clusterDuplicateBuckets } from "./cluster";

describe("clusterDuplicateBuckets", () => {
  it("keeps disjoint buckets as separate groups", () => {
    const clusters = clusterDuplicateBuckets([
      {
        matchType: "email",
        matchKey: "a@example.com",
        personIds: ["p1", "p2"],
      },
      {
        matchType: "phone",
        matchKey: "0320000000",
        personIds: ["p3", "p4"],
      },
    ]);

    assert.equal(clusters.length, 2);
    assert.deepEqual(
      clusters.map((c) => c.personIds).sort((a, b) => a[0]!.localeCompare(b[0]!)),
      [
        ["p1", "p2"],
        ["p3", "p4"],
      ],
    );
  });

  it("merges transitively connected buckets", () => {
    const clusters = clusterDuplicateBuckets([
      {
        matchType: "email",
        matchKey: "a@example.com",
        personIds: ["p1", "p2"],
      },
      {
        matchType: "name",
        matchKey: "jean|dupont",
        personIds: ["p2", "p3"],
      },
    ]);

    assert.equal(clusters.length, 1);
    assert.deepEqual(clusters[0]!.personIds, ["p1", "p2", "p3"]);
    assert.deepEqual(clusters[0]!.matchTypes, ["email", "name"]);
  });
});
