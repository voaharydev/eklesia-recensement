import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getBranchLabel } from "@/lib/constants/branches";
import type { DashboardMetrics } from "@/lib/admin/types";

type BranchDistributionProps = {
  branchCounts: DashboardMetrics["branchCounts"];
  title: string;
  emptyLabel: string;
};

export function BranchDistribution({
  branchCounts,
  title,
  emptyLabel,
}: BranchDistributionProps) {
  const entries = Object.entries(branchCounts).sort(([, a], [, b]) => b - a);
  const maxCount = entries[0]?.[1] ?? 0;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {entries.map(([code, count]) => (
              <li key={code}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {getBranchLabel(code)}
                  </span>
                  <span className="text-muted">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: maxCount > 0 ? `${(count / maxCount) * 100}%` : "0%",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
