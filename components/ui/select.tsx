import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, hasError, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "input-base",
          hasError && "border-status-error bg-status-error/5 focus:border-status-error focus:ring-status-error/30",
          className,
        )}
        {...props}
      />
    );
  },
);
