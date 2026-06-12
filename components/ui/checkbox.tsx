import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-5 w-5 min-h-[1.25rem] min-w-[1.25rem] rounded border-border text-primary focus-ring",
          className,
        )}
        {...props}
      />
    );
  },
);
