import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export type AlertVariant = "error" | "success" | "info";

const variantClasses: Record<AlertVariant, string> = {
  error: "border-status-error/30 bg-status-error/5 text-status-error",
  success: "border-status-success/30 bg-status-success/5 text-status-success",
  info: "border-status-info/30 bg-status-info/5 text-status-info",
};

type AlertProps = {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
};

export function Alert({ variant, children, className }: AlertProps) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}

type WizardAlertProps = {
  error?: string | null;
  success?: string | null;
  info?: string | null;
  className?: string;
};

/** Single banner: error > success > info */
export function WizardAlert({
  error,
  success,
  info,
  className,
}: WizardAlertProps) {
  if (error) {
    return (
      <Alert variant="error" className={className}>
        {error}
      </Alert>
    );
  }
  if (success) {
    return (
      <Alert variant="success" className={className}>
        {success}
      </Alert>
    );
  }
  if (info) {
    return (
      <Alert variant="info" className={className}>
        {info}
      </Alert>
    );
  }
  return null;
}
