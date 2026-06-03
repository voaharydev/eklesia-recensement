"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { humanizeZodFieldMessage } from "@/lib/validations/format-zod-error";

type FormFieldProps = {
  label: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, id, className, name, ...props }, ref) {
    const fieldId = id ?? name;
    const displayError = error ? humanizeZodFieldMessage(error) : undefined;
    const hasError = Boolean(displayError);

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={fieldId}
          className={`text-sm font-medium ${hasError ? "text-red-800" : "text-gray-700"}`}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={fieldId}
          name={name}
          aria-invalid={hasError}
          className={`rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 ${
            hasError
              ? "border-red-500 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          } ${className ?? ""}`}
          {...props}
        />
        {displayError ? (
          <p className="text-sm font-medium text-red-600" role="alert">
            {displayError}
          </p>
        ) : null}
      </div>
    );
  },
);
