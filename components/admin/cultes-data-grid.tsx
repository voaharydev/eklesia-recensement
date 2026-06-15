import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort } from "@/lib/format/datetime";
import type { ServiceWithStatusCounts } from "@/lib/scheduling/types";

type CultesDataGridProps = {
  services: ServiceWithStatusCounts[];
  labels: {
    date: string;
    title: string;
    draft: string;
    pending: string;
    accepted: string;
    declined: string;
    cancelled: string;
    view: string;
    empty: string;
  };
};

export function CultesDataGrid({ services, labels }: CultesDataGridProps) {
  if (services.length === 0) {
    return <p className="text-sm text-muted">{labels.empty}</p>;
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-surface-muted">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.date}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.title}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.draft}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.pending}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.accepted}
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted">
                {labels.declined}
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted">
                {labels.view}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {services.map((service) => (
              <tr
                key={service.id}
                className={service.cancelled_at ? "bg-surface-muted/60" : undefined}
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    {formatDateShort(service.service_date)}
                    {service.cancelled_at ? (
                      <Badge variant="default">{labels.cancelled}</Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted">{service.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="default">{service.statusCounts.draft}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="warning">{service.statusCounts.pending}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="success">{service.statusCounts.accepted}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="error">{service.statusCounts.declined}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/cultes/${service.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {labels.view}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
