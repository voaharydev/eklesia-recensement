"use client";

import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";

type ShowCancelledFilterProps = {
  showCancelled: boolean;
  label: string;
};

export function ShowCancelledFilter({
  showCancelled,
  label,
}: ShowCancelledFilterProps) {
  return (
    <Link
      href={showCancelled ? "/admin/cultes" : "/admin/cultes?showCancelled=1"}
      className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"
    >
      <Checkbox checked={showCancelled} readOnly aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
