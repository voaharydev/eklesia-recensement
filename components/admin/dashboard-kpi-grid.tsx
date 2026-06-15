import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardMetrics } from "@/lib/admin/types";

type DashboardKpiGridProps = {
  metrics: DashboardMetrics;
  labels: {
    activeHouseholds: string;
    totalMembers: string;
    adultCount: string;
    childCount: string;
    baptizedCount: string;
    mpandrayCount: string;
    mpiandryCount: string;
    sefalaCount: string;
    mpamakyTenyCount: string;
  };
};

const kpiKeys = [
  "activeHouseholds",
  "totalMembers",
  "adultCount",
  "childCount",
  "baptizedCount",
  "mpandrayCount",
  "mpiandryCount",
  "sefalaCount",
  "mpamakyTenyCount",
] as const;

export function DashboardKpiGrid({ metrics, labels }: DashboardKpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiKeys.map((key) => (
        <Card key={key}>
          <CardHeader className="py-3">
            <p className="text-sm font-medium text-muted">{labels[key]}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-bold text-foreground">{metrics[key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
