import { cn } from "@/components/ui/cn";

type ChevronIconProps = {
  expanded?: boolean;
  className?: string;
};

export function ChevronIcon({ expanded = false, className }: ChevronIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className={cn(
        "h-5 w-5 shrink-0 text-muted transition-transform",
        expanded && "rotate-180",
        className,
      )}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
