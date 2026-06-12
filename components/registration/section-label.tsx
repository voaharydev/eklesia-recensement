import { cn } from "@/components/ui/cn";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted",
        className,
      )}
    >
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
