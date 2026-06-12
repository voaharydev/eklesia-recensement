"use client";

import { useId, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { ChevronIcon } from "@/components/ui/chevron-icon";
import { cn } from "@/components/ui/cn";

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
  const t = useTranslations("form.status");
  const generatedId = useId();
  const panelId = cardId ? `${cardId}-panel` : `${generatedId}-panel`;

  const borderClass = hasError
    ? "border-status-error ring-1 ring-status-error/20"
    : variant === "child"
      ? "border-dashed border-border"
      : "border-border";

  const badgeVariant = hasError
    ? "error"
    : isComplete
      ? "success"
      : "warning";

  const statusLabel = hasError
    ? t("toFix")
    : isComplete
      ? t("complete")
      : t("toComplete");

  return (
    <div
      id={cardId}
      className={cn("scroll-mt-24 rounded-lg border bg-surface", borderClass)}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-start justify-between gap-3 rounded-lg p-4 text-left hover:bg-surface-muted focus-ring"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{title}</span>
            <Badge variant={badgeVariant}>{statusLabel}</Badge>
          </div>
          <p className="mt-1 truncate text-sm text-muted">{summary}</p>
        </div>
        <ChevronIcon expanded={isOpen} className="mt-0.5" />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={cardId}
          className="border-t border-border px-4 pb-4 pt-2"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
