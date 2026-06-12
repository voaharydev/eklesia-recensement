import Link from "next/link";

import { SpiritualBadges } from "@/components/admin/spiritual-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getBranchLabel } from "@/lib/constants/branches";
import type { PaginatedMembers } from "@/lib/admin/types";

type MembersDataGridProps = {
  data: PaginatedMembers;
  searchParams: Record<string, string | undefined>;
  labels: {
    name: string;
    household: string;
    role: string;
    age: string;
    email: string;
    phone: string;
    spiritual: string;
    assignments: string;
    householdUpdated: string;
    noResults: string;
    previous: string;
    next: string;
    pageInfo: string;
    roleLabels: Record<string, string>;
    spiritualLabels: {
      baptized: string;
      mpandray: string;
      mpiandry: string;
      mpamakyTeny: string;
    };
  };
};

function truncateText(value: string | null, max = 40): string {
  if (!value?.trim()) return "—";
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function formatHouseholdUpdated(value: string | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBranches(
  branches: { branch_code: string; role: string | null }[],
): string {
  if (!branches.length) return "—";
  return branches
    .map((b) => {
      const label = getBranchLabel(b.branch_code);
      return b.role ? `${label} (${b.role})` : label;
    })
    .join(", ");
}

export function MembersDataGrid({
  data,
  searchParams,
  labels,
}: MembersDataGridProps) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const hasPrevious = data.page > 1;
  const hasNext = data.page < totalPages;

  function pageHref(page: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        params.set(key, value);
      }
    }
    params.set("page", String(page));
    return `/admin/members?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-surface-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.name}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.household}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.householdUpdated}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.role}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.age}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.email}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.phone}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.spiritual}
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  {labels.assignments}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted">
                    {labels.noResults}
                  </td>
                </tr>
              ) : (
                data.rows.map((person) => (
                  <tr key={person.id} className="hover:bg-surface-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {person.last_name} {person.first_name}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/households/${person.household.id}`}
                        className="text-primary hover:text-primary-hover"
                      >
                        {person.household.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatHouseholdUpdated(person.household.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>
                        {labels.roleLabels[person.role] ?? person.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {person.age ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {truncateText(person.email, 30)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {truncateText(person.phone, 20)}
                    </td>
                    <td className="px-4 py-3">
                      <SpiritualBadges
                        person={person}
                        labels={labels.spiritualLabels}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="max-w-xs">
                        {truncateText(person.church_assignments, 50)}
                        {person.branches?.length ? (
                          <p className="mt-1 text-xs">
                            {formatBranches(person.branches)}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted">{labels.pageInfo}</p>
        <div className="flex gap-2">
          {hasPrevious ? (
            <Link href={pageHref(data.page - 1)}>
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
            <Link href={pageHref(data.page + 1)}>
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
    </div>
  );
}
