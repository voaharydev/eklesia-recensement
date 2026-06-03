"use client";

import type { ReactNode } from "react";

type PersonAccordionCardProps = {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  hasError?: boolean;
  isComplete?: boolean;
  variant?: "adult" | "child";
  cardId?: string;
  children: ReactNode;
};

export function PersonAccordionCard({
  title,
  summary,
  isOpen,
  onToggle,
  hasError = false,
  isComplete = false,
  variant = "adult",
  cardId,
  children,
}: PersonAccordionCardProps) {
  const borderClass = hasError
    ? "border-red-400 ring-1 ring-red-200"
    : variant === "child"
      ? "border-dashed border-gray-300"
      : "border-gray-200";

  const statusLabel = hasError
    ? "À corriger"
    : isComplete
      ? "Complet"
      : "À compléter";

  const statusClass = hasError
    ? "bg-red-100 text-red-800"
    : isComplete
      ? "bg-green-100 text-green-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div
      id={cardId}
      className={`scroll-mt-24 rounded-lg border ${borderClass} bg-white`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-3 rounded-lg p-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{title}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-gray-600">{summary}</p>
        </div>
        <span
          className={`mt-0.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>

      {isOpen ? (
        <div className="border-t border-gray-100 px-4 pb-4 pt-2">{children}</div>
      ) : null}
    </div>
  );
}
