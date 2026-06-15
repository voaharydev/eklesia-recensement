import Link from "next/link";

import { logoutAdminAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

type AdminNavProps = {
  labels: {
    title: string;
    dashboard: string;
    members: string;
    cultes: string;
    communication: string;
    announcements: string;
    doublons: string;
    importExcel: string;
    logout: string;
  };
};

const navLinks = [
  { href: "/admin", labelKey: "dashboard" as const },
  { href: "/admin/members", labelKey: "members" as const },
  { href: "/admin/cultes", labelKey: "cultes" as const },
  { href: "/admin/communication", labelKey: "communication" as const },
  { href: "/admin/annonces", labelKey: "announcements" as const },
  { href: "/admin/doublons", labelKey: "doublons" as const },
  { href: "/fr/admin/import", labelKey: "importExcel" as const },
];

export function AdminNav({ labels }: AdminNavProps) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Administration
          </p>
          <h1 className="text-lg font-semibold text-foreground">{labels.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2" aria-label="Navigation admin">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground",
                )}
              >
                {labels[item.labelKey]}
              </Link>
            ))}
          </nav>
          <form action={logoutAdminAction}>
            <Button type="submit" variant="secondary" size="sm">
              {labels.logout}
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
