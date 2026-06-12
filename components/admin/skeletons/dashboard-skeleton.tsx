import { Card, CardContent, CardHeader } from "@/components/ui/card";

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-8 w-16 animate-pulse rounded bg-surface-muted" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded bg-surface-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-surface-muted" />
              <div className="h-2 w-full animate-pulse rounded bg-surface-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
