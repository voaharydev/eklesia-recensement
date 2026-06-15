"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/components/ui/cn";

type AnnouncementsAdminTabsProps = {
  labels: {
    pending: string;
    published: string;
  };
};

export function AnnouncementsAdminTabs({ labels }: AnnouncementsAdminTabsProps) {
  const pathname = usePathname();
  const isPublished = pathname.startsWith("/admin/annonces/publiees");

  return (
    <nav className="flex gap-2 border-b border-border" aria-label="Sections annonces">
      <Link
        href="/admin/annonces"
        className={cn(
          "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
          !isPublished
            ? "border-indigo-600 text-foreground"
            : "border-transparent text-muted hover:text-foreground",
        )}
      >
        {labels.pending}
      </Link>
      <Link
        href="/admin/annonces/publiees"
        className={cn(
          "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
          isPublished
            ? "border-indigo-600 text-foreground"
            : "border-transparent text-muted hover:text-foreground",
        )}
      >
        {labels.published}
      </Link>
    </nav>
  );
}
