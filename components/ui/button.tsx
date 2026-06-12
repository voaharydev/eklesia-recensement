import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/components/ui/cn";

const variantClasses = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-60",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-surface-muted disabled:opacity-60",
  ghost:
    "text-primary hover:bg-primary/5 disabled:opacity-60",
  danger:
    "border border-status-error/30 bg-surface text-status-error hover:bg-status-error/5 disabled:opacity-60",
} as const;

const sizeClasses = {
  default: "min-h-11 px-4 py-2.5 text-sm",
  sm: "min-h-9 px-3 py-1.5 text-sm",
  pill: "min-h-11 rounded-full px-4 py-2 text-sm",
} as const;

export type ButtonVariant = keyof typeof variantClasses;
export type ButtonSize = keyof typeof sizeClasses;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "default", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-ring disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);
