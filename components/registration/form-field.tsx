"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import { useRegistrationSchemas } from "@/lib/i18n/client";

type FormFieldProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, id, className, name, ...props }, ref) {
    const { humanizeZodFieldMessage } = useRegistrationSchemas();
    const fieldId = id ?? name;
    const displayError = error ? humanizeZodFieldMessage(error) : undefined;
    const hasError = Boolean(displayError);

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className={cn(
            "text-sm font-medium",
            hasError ? "text-status-error" : "text-foreground",
          )}
        >
          {label}
        </label>
        <Input
          ref={ref}
          id={fieldId}
          name={name}
          aria-invalid={hasError}
          hasError={hasError}
          className={className}
          {...props}
        />
        {displayError ? (
          <p className="text-sm font-medium text-status-error" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>
    );
  },
);
