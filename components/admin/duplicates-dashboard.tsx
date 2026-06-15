import type { DuplicateGroup } from "@/lib/deduplication/types";

import {
  DuplicateGroupCard,
  type DuplicateGroupCardLabels,
} from "./duplicate-group-card";
import {
  DuplicatesPagination,
  type DuplicatesPaginationLabels,
} from "./duplicates-pagination";

type DuplicatesDashboardProps = {
  group: DuplicateGroup;
  page: number;
  totalPages: number;
  groupProgress: string;
  labels: DuplicateGroupCardLabels;
  paginationLabels: DuplicatesPaginationLabels;
};

export function DuplicatesDashboard({
  group,
  page,
  totalPages,
  groupProgress,
  labels,
  paginationLabels,
}: DuplicatesDashboardProps) {
  return (
    <div className="space-y-6">
      <DuplicatesPagination
        page={page}
        totalPages={totalPages}
        labels={paginationLabels}
      />
      <DuplicateGroupCard
        group={group}
        labels={labels}
        groupProgress={groupProgress}
      />
      <DuplicatesPagination
        page={page}
        totalPages={totalPages}
        labels={paginationLabels}
      />
    </div>
  );
}
