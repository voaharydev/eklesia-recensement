import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { filterServicesByProgress } from "@/lib/scheduling/filter-services";
import type { ServiceWithStatusCounts } from "@/lib/scheduling/types";

function makeService(
  id: string,
  statusCounts: ServiceWithStatusCounts["statusCounts"],
): ServiceWithStatusCounts {
  return {
    id,
    service_date: "2026-06-15",
    title: "Culte",
    created_at: "2026-01-01T00:00:00Z",
    cancelled_at: null,
    statusCounts,
  };
}

describe("filterServicesByProgress", () => {
  const services = [
    makeService("draft", { draft: 5, pending: 0, accepted: 0, declined: 0 }),
    makeService("pending", { draft: 0, pending: 2, accepted: 3, declined: 0 }),
    makeService("declined", { draft: 0, pending: 0, accepted: 4, declined: 1 }),
    makeService("mixed", { draft: 1, pending: 1, accepted: 3, declined: 0 }),
  ];

  it("returns all services when progress is all", () => {
    assert.equal(filterServicesByProgress(services, "all").length, 4);
  });

  it("filters draft-only services", () => {
    const result = filterServicesByProgress(services, "draft");
    assert.deepEqual(
      result.map((service) => service.id),
      ["draft"],
    );
  });

  it("filters services with pending assignments", () => {
    const result = filterServicesByProgress(services, "pending");
    assert.deepEqual(
      result.map((service) => service.id),
      ["pending", "mixed"],
    );
  });

  it("filters services with declined assignments", () => {
    const result = filterServicesByProgress(services, "declined");
    assert.deepEqual(
      result.map((service) => service.id),
      ["declined"],
    );
  });
});
