"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export type PersonNavItem = {
  id: string;
  label: string;
  kind: "adult" | "otherAdult" | "child";
  index: number;
  hasError?: boolean;
  isActive?: boolean;
};

type PersonQuickNavProps = {
  items: PersonNavItem[];
  onSelect: (item: PersonNavItem) => void;
};

export function PersonQuickNav({ items, onSelect }: PersonQuickNavProps) {
  const t = useTranslations("wizard.nav");

  if (items.length < 2) {
    return null;
  }

  return (
    <div className="relative -mx-1">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:hidden"
        aria-hidden
      />
      <nav
        aria-label={t("quickNav")}
        className="overflow-x-auto px-1 pb-1 scroll-smooth snap-x snap-mandatory"
      >
        <ul className="flex gap-2">
          {items.map((item) => (
            <li key={item.id} className="shrink-0 snap-start">
              <Button
                type="button"
                size="pill"
                variant={item.isActive ? "primary" : "secondary"}
                onClick={() => onSelect(item)}
                className={cn(
                  !item.isActive &&
                    item.hasError &&
                    "border-status-error/40 bg-status-error/5 text-status-error hover:bg-status-error/10",
                  !item.isActive &&
                    !item.hasError &&
                    "bg-surface text-foreground hover:bg-surface-muted",
                )}
              >
                {item.label}
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
