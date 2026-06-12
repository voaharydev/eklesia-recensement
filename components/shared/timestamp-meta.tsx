import { formatDateTimeShort } from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

type TimestampMetaProps = {
  createdAt: string | null | undefined;
  updatedAt: string | null | undefined;
  labels: {
    created: string;
    updated: string;
  };
  locale?: string;
  className?: string;
  inline?: boolean;
};

export function TimestampMeta({
  createdAt,
  updatedAt,
  labels,
  locale,
  className,
  inline = false,
}: TimestampMetaProps) {
  return (
    <div
      className={cn(
        "text-sm text-muted",
        inline ? "flex flex-wrap gap-x-4 gap-y-1" : "grid gap-1",
        className,
      )}
    >
      <p>
        <span className="font-medium text-foreground">{labels.created}</span>
        {": "}
        {formatDateTimeShort(createdAt, locale)}
      </p>
      <p>
        <span className="font-medium text-foreground">{labels.updated}</span>
        {": "}
        {formatDateTimeShort(updatedAt, locale)}
      </p>
    </div>
  );
}
