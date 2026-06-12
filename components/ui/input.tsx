import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "input-base",
        hasError && "border-status-error bg-status-error/5 focus:border-status-error focus:ring-status-error/30",
        className,
      )}
      {...props}
    />
  );
});
