import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatEmailsDisplay,
  getPrimaryEmail,
  mergeEmailLists,
  normalizeEmails,
  personHasEmail,
  personMatchesAnyEmail,
} from "./person-contacts";

describe("normalizeEmails", () => {
  it("trims, lowercases and deduplicates", () => {
    assert.deepEqual(
      normalizeEmails(["  Foo@Bar.com ", "foo@bar.com", "", "other@test.com"]),
      ["foo@bar.com", "other@test.com"],
    );
  });
});

describe("getPrimaryEmail", () => {
  it("returns the first email", () => {
    assert.equal(
      getPrimaryEmail({ emails: ["primary@test.com", "other@test.com"], phones: [] }),
      "primary@test.com",
    );
  });
});

describe("personHasEmail", () => {
  it("matches any email on the person", () => {
    const person = {
      emails: ["first@test.com", "second@test.com"],
      phones: [],
    };
    assert.equal(personHasEmail(person, "second@test.com"), true);
    assert.equal(personHasEmail(person, "missing@test.com"), false);
  });
});

describe("personMatchesAnyEmail", () => {
  it("returns true when any person email is in the set", () => {
    const person = {
      emails: ["a@test.com", "b@test.com"],
      phones: [],
    };
    assert.equal(personMatchesAnyEmail(person, new Set(["b@test.com"])), true);
    assert.equal(personMatchesAnyEmail(person, new Set(["c@test.com"])), false);
  });
});

describe("mergeEmailLists", () => {
  it("unions lists with master order first", () => {
    assert.deepEqual(
      mergeEmailLists(["a@test.com"], ["b@test.com", "a@test.com"]),
      ["a@test.com", "b@test.com"],
    );
  });
});

describe("formatEmailsDisplay", () => {
  it("shows compact label for many emails", () => {
    assert.equal(
      formatEmailsDisplay(["a@test.com", "b@test.com", "c@test.com"]),
      "a@test.com, +2",
    );
  });
});
