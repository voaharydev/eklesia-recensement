import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getRecentAssigneeEmails,
  pickVolunteerForSlot,
  type AssignmentHistoryEntry,
} from "@/lib/scheduling/cooldown";
import type { Person } from "@/types/database";

function person(id: string, email: string, first = "A", last = "B"): Person {
  return {
    id,
    household_id: "h1",
    first_name: first,
    last_name: last,
    email,
    is_child: false,
    is_mpamaky_teny: true,
    branches: [],
    created_at: "",
    updated_at: "",
    phone: null,
    preferred_language: "fr",
    is_visible_in_directory: true,
    is_baptized: false,
    baptized_since: null,
    is_mpiandry: false,
    mpiandry_since: null,
    is_mpandray: false,
    mpandray_since: null,
    age: null,
    church_assignments: null,
    civility: null,
    role: "member",
  };
}

describe("getRecentAssigneeEmails", () => {
  it("includes assignments within the cooldown window", () => {
    const history: AssignmentHistoryEntry[] = [
      { serviceDate: "2026-03-01", email: "alice@example.com", roleCode: "priere" },
    ];

    const recent = getRecentAssigneeEmails(history, "2026-06-15");
    assert.equal(recent.has("alice@example.com"), true);
  });

  it("excludes assignments outside the cooldown window", () => {
    const history: AssignmentHistoryEntry[] = [
      { serviceDate: "2025-01-01", email: "alice@example.com", roleCode: "priere" },
    ];

    const recent = getRecentAssigneeEmails(history, "2026-06-15");
    assert.equal(recent.has("alice@example.com"), false);
  });
});

describe("pickVolunteerForSlot", () => {
  const pool = [
    person("1", "alice@example.com", "Alice", "A"),
    person("2", "bob@example.com", "Bob", "B"),
    person("3", "carol@example.com", "Carol", "C"),
  ];

  it("picks an alternative when the preferred volunteer is in cooldown", () => {
    const recent = new Set(["alice@example.com"]);
    const picked = pickVolunteerForSlot(pool, 0, recent, new Set());

    assert.equal(picked.email, "bob@example.com");
  });

  it("falls back to cooldown when no alternative exists", () => {
    const smallPool = [person("1", "alice@example.com"), person("2", "bob@example.com")];
    const recent = new Set(["alice@example.com", "bob@example.com"]);
    const picked = pickVolunteerForSlot(smallPool, 0, recent, new Set());

    assert.equal(picked.email, "alice@example.com");
  });

  it("never assigns the same email twice on the same service", () => {
    const recent = new Set<string>();
    const alreadyPicked = new Set(["alice@example.com"]);
    const picked = pickVolunteerForSlot(pool, 0, recent, alreadyPicked);

    assert.equal(picked.email, "bob@example.com");
  });

  it("treats duplicate emails across person records as the same volunteer", () => {
    const duplicatePool = [
      person("1", "alice@example.com", "Alice", "Dup"),
      person("2", "alice@example.com", "Alice", "Other"),
      person("3", "bob@example.com", "Bob", "B"),
    ];
    const alreadyPicked = new Set(["alice@example.com"]);
    const picked = pickVolunteerForSlot(duplicatePool, 0, new Set(), alreadyPicked);

    assert.equal(picked.email, "bob@example.com");
  });
});
