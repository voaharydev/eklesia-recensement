import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildDashboardMonthly,
  buildLastSixMonthBuckets,
  type DashboardHouseholdRow,
  type DashboardPersonRow,
} from "@/lib/admin/dashboard-monthly";

describe("buildLastSixMonthBuckets", () => {
  it("returns six consecutive calendar months ending at reference month", () => {
    const buckets = buildLastSixMonthBuckets(new Date("2026-06-15"));
    assert.equal(buckets.length, 6);
    assert.equal(buckets[0]?.monthKey, "2026-01");
    assert.equal(buckets[5]?.monthKey, "2026-06");
  });
});

describe("buildDashboardMonthly", () => {
  const households: DashboardHouseholdRow[] = [
    {
      id: "h1",
      created_at: "2026-01-10T10:00:00Z",
      updated_at: "2026-03-05T10:00:00Z",
      unregistered_at: null,
    },
    {
      id: "h2",
      created_at: "2026-02-01T10:00:00Z",
      updated_at: "2026-02-01T10:00:00Z",
      unregistered_at: "2026-04-20T10:00:00Z",
    },
    {
      id: "h3",
      created_at: "2026-06-01T10:00:00Z",
      updated_at: "2026-06-01T10:00:00Z",
      unregistered_at: null,
    },
  ];

  const persons: DashboardPersonRow[] = [
    {
      id: "p1",
      created_at: "2026-01-15T10:00:00Z",
      household_id: "h1",
      household: {
        created_at: "2026-01-10T10:00:00Z",
        unregistered_at: null,
      },
    },
    {
      id: "p2",
      created_at: "2026-02-10T10:00:00Z",
      household_id: "h2",
      household: {
        created_at: "2026-02-01T10:00:00Z",
        unregistered_at: "2026-04-20T10:00:00Z",
      },
    },
    {
      id: "p3",
      created_at: "2026-06-02T10:00:00Z",
      household_id: "h3",
      household: {
        created_at: "2026-06-01T10:00:00Z",
        unregistered_at: null,
      },
    },
  ];

  it("aggregates creations, updates, archives and stock", () => {
    const monthly = buildDashboardMonthly(
      households,
      persons,
      new Date("2026-06-15"),
    );

    const january = monthly.find((bucket) => bucket.monthKey === "2026-01");
    const february = monthly.find((bucket) => bucket.monthKey === "2026-02");
    const march = monthly.find((bucket) => bucket.monthKey === "2026-03");
    const april = monthly.find((bucket) => bucket.monthKey === "2026-04");
    const june = monthly.find((bucket) => bucket.monthKey === "2026-06");

    assert.equal(january?.householdsCreated, 1);
    assert.equal(january?.membersCreated, 1);
    assert.equal(february?.householdsCreated, 1);
    assert.equal(march?.householdsUpdated, 1);
    assert.equal(april?.householdsArchived, 1);
    assert.equal(june?.householdsCreated, 1);
    assert.equal(june?.activeHouseholds, 2);
    assert.equal(june?.activeMembers, 2);
  });
});
