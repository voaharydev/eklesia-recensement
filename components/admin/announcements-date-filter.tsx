"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import { formatDateShort } from "@/lib/format/datetime";

type AnnouncementsDateFilterProps = {
  basePath: string;
  selectedDate: string | null;
  availableDates: string[];
  labels: {
    dateLabel: string;
    allDates: string;
    submit: string;
  };
};

export function AnnouncementsDateFilter({
  basePath,
  selectedDate,
  availableDates,
  labels,
}: AnnouncementsDateFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigateToDate(date: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (date) {
      params.set("date", date);
    } else {
      params.delete("date");
    }
    const query = params.toString();
    router.push(`${basePath}${query ? `?${query}` : ""}`);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const date = formData.get("date")?.toString().trim() ?? "";
    navigateToDate(date || null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="browse-date" className="text-sm font-medium text-foreground">
            {labels.dateLabel}
          </label>
          <Input
            id="browse-date"
            name="date"
            type="date"
            defaultValue={selectedDate ?? ""}
            list="announcement-available-dates"
          />
          <datalist id="announcement-available-dates">
            {availableDates.map((date) => (
              <option key={date} value={date} />
            ))}
          </datalist>
        </div>
        <button
          type="submit"
          className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700",
          )}
        >
          {labels.submit}
        </button>
      </form>

      {availableDates.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigateToDate(null)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              selectedDate === null
                ? "bg-surface-muted text-foreground"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            {labels.allDates}
          </button>
          {availableDates.map((date) => (
            <button
              key={date}
              type="button"
              onClick={() => navigateToDate(date)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                selectedDate === date
                  ? "bg-surface-muted text-foreground"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {formatDateShort(date)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
