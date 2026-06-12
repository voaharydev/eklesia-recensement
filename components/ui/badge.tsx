import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export type BadgeVariant = "default" | "success" | "warning" | "error";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-muted",
  success: "bg-status-success/10 text-status-success",
  warning: "bg-status-warning/10 text-status-warning",
  error: "bg-status-error/10 text-status-error",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
