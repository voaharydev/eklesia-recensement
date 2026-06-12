"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type WizardActionBarProps = {
  onBack?: () => void;
  backLabel?: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  showBack?: boolean;
  showSubmit?: boolean;
  children?: ReactNode;
  className?: string;
};

export function WizardActionBar({
  onBack,
  backLabel,
  submitLabel,
  submittingLabel,
  isSubmitting = false,
  showBack = true,
  showSubmit = true,
  children,
  className,
}: WizardActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-6 -mb-6 mt-6 border-t border-border bg-surface px-6 py-4 sm:-mx-8 sm:-mb-8 sm:px-8",
        className,
      )}
    >
      {children}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {showBack && onBack ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {backLabel}
          </Button>
        ) : (
          <span />
        )}
        {showSubmit ? (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && submittingLabel ? submittingLabel : submitLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
