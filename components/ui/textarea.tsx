import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, hasError, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "input-base resize-y",
          hasError && "border-status-error bg-status-error/5 focus:border-status-error focus:ring-status-error/30",
          className,
        )}
        {...props}
      />
    );
  },
);
