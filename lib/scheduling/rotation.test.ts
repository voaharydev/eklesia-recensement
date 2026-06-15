import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enumerateDatesInRange,
  getRotationWeekIndex,
  getSundaysOfYear,
} from "@/lib/scheduling/rotation";

describe("enumerateDatesInRange", () => {
  it("returns each day in range inclusive", () => {
    const dates = enumerateDatesInRange("2026-06-01", "2026-06-03");
    assert.deepEqual(dates, ["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("rejects ranges longer than 366 days", () => {
    assert.throws(() =>
      enumerateDatesInRange("2026-01-01", "2027-01-10"),
    );
  });
});

describe("getRotationWeekIndex", () => {
  it("uses sunday index for sundays", () => {
    const sundays = getSundaysOfYear(2026);
    assert.equal(getRotationWeekIndex(sundays[0]), 0);
  });

  it("returns a stable index for non-sunday dates", () => {
    const index = getRotationWeekIndex("2026-06-17");
    assert.equal(typeof index, "number");
    assert.ok(index >= 0);
  });
});
