import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("border-b border-border px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={cn("px-6 py-6", className)} {...props}>
      {children}
    </div>
  );
}
