import { Card, CardContent } from "@/components/ui/card";

export function MembersTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-0 divide-y divide-border">
          <div className="h-12 animate-pulse bg-surface-muted/50" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
              <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
              <div className="h-4 flex-1 animate-pulse rounded bg-surface-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
