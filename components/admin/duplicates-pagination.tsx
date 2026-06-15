import Link from "next/link";

import { Button } from "@/components/ui/button";

export type DuplicatesPaginationLabels = {
  pageInfo: string;
  previous: string;
  next: string;
};

type DuplicatesPaginationProps = {
  page: number;
  totalPages: number;
  labels: DuplicatesPaginationLabels;
};

function pageHref(page: number): string {
  return `/admin/doublons?page=${page}`;
}

export function DuplicatesPagination({
  page,
  totalPages,
  labels,
}: DuplicatesPaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">{labels.pageInfo}</p>
      <div className="flex gap-2">
        {hasPrevious ? (
          <Link href={pageHref(page - 1)}>
            <Button variant="secondary" size="sm">
              {labels.previous}
            </Button>
          </Link>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            {labels.previous}
          </Button>
        )}
        {hasNext ? (
          <Link href={pageHref(page + 1)}>
            <Button variant="secondary" size="sm">
              {labels.next}
            </Button>
          </Link>
        ) : (
          <Button variant="secondary" size="sm" disabled>
            {labels.next}
          </Button>
        )}
      </div>
    </div>
  );
}
