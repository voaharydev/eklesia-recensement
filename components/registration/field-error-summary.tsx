"use client";

import { humanizeZodFieldMessage } from "@/lib/validations/format-zod-error";

type FieldErrorSummaryProps = {
  messages: string[];
};

export function FieldErrorSummary({ messages }: FieldErrorSummaryProps) {
  if (messages.length === 0) return null;

  const unique = Array.from(
    new Set(messages.map((message) => humanizeZodFieldMessage(message))),
  );

  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
      role="alert"
    >
      <p className="text-sm font-medium text-red-900">Champs à corriger</p>
      <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-red-800">
        {unique.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
