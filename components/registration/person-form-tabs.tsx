"use client";

import { useId, type ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export type PersonFormTab = "identity" | "church";

type PersonFormTabsProps = {
  activeTab: PersonFormTab;
  onTabChange: (tab: PersonFormTab) => void;
  identityLabel: string;
  churchLabel: string;
  churchHasError?: boolean;
  identityContent: ReactNode;
  churchContent: ReactNode;
  churchFooter?: ReactNode;
};

export function PersonFormTabs({
  activeTab,
  onTabChange,
  identityLabel,
  churchLabel,
  churchHasError = false,
  identityContent,
  churchContent,
  churchFooter,
}: PersonFormTabsProps) {
  const baseId = useId();
  const identityPanelId = `${baseId}-identity`;
  const churchPanelId = `${baseId}-church`;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={identityLabel}
        className="flex gap-1 rounded-lg border border-border bg-surface-muted p-1"
      >
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-identity`}
          aria-selected={activeTab === "identity"}
          aria-controls={identityPanelId}
          onClick={() => onTabChange("identity")}
          className={cn(
            "min-h-11 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring",
            activeTab === "identity"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {identityLabel}
        </button>
        <button
          type="button"
          role="tab"
          id={`${baseId}-tab-church`}
          aria-selected={activeTab === "church"}
          aria-controls={churchPanelId}
          onClick={() => onTabChange("church")}
          className={cn(
            "min-h-11 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring",
            activeTab === "church"
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
            churchHasError && activeTab !== "church" && "text-status-error",
          )}
        >
          {churchLabel}
          {churchHasError && activeTab !== "church" ? (
            <span className="ml-1 text-status-error" aria-hidden>
              •
            </span>
          ) : null}
        </button>
      </div>

      {activeTab === "identity" ? (
        <div
          role="tabpanel"
          id={identityPanelId}
          aria-labelledby={`${baseId}-tab-identity`}
        >
          {identityContent}
        </div>
      ) : null}

      {activeTab === "church" ? (
        <div
          role="tabpanel"
          id={churchPanelId}
          aria-labelledby={`${baseId}-tab-church`}
        >
          {churchContent}
          {churchFooter}
        </div>
      ) : null}
    </div>
  );
}
