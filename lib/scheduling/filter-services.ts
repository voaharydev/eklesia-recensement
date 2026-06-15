import type { CultesProgressFilter } from "@/lib/scheduling/parse-cultes-search-params";
import type { ServiceWithStatusCounts } from "@/lib/scheduling/types";

export function filterServicesByProgress(
  services: ServiceWithStatusCounts[],
  progress: CultesProgressFilter,
): ServiceWithStatusCounts[] {
  if (progress === "all") {
    return services;
  }

  return services.filter((service) => {
    const { draft, pending, declined, accepted } = service.statusCounts;

    switch (progress) {
      case "draft":
        return draft > 0 && pending + declined + accepted === 0;
      case "pending":
        return pending > 0;
      case "declined":
        return declined > 0;
      default:
        return true;
    }
  });
}
