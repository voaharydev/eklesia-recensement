"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addServiceDate,
  addServiceDateRange,
} from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ChevronIcon } from "@/components/ui/chevron-icon";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/input";
import { enumerateDatesInRange } from "@/lib/scheduling/rotation";

type ManageCultesDatesFormProps = {
  className?: string;
  labels: {
    title: string;
    singleTitle: string;
    rangeTitle: string;
    serviceDate: string;
    dateFrom: string;
    dateTo: string;
    titleOptional: string;
    addDate: string;
    addDateRange: string;
    adding: string;
    addDateSuccess: string;
    addRangeSuccess: string;
    rangeConfirm: string;
    error: string;
  };
};

export function ManageCultesDatesForm({
  className,
  labels,
}: ManageCultesDatesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [singleDate, setSingleDate] = useState("");
  const [singleTitle, setSingleTitle] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rangeTitle, setRangeTitle] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAddSingle(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await addServiceDate({
        serviceDate: singleDate,
        title: singleTitle.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(labels.addDateSuccess);
      setSingleDate("");
      setSingleTitle("");
      router.refresh();
    });
  }

  function handleAddRange(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const dates = enumerateDatesInRange(fromDate, toDate);
      if (dates.length > 31) {
        const confirmed = window.confirm(
          labels.rangeConfirm.replace("{count}", String(dates.length)),
        );
        if (!confirmed) return;
      }

      startTransition(async () => {
        const result = await addServiceDateRange({
          fromDate,
          toDate,
          title: rangeTitle.trim() || undefined,
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        if (!result.data) return;

        setMessage(
          labels.addRangeSuccess
            .replace("{created}", String(result.data.created))
            .replace("{skipped}", String(result.data.skipped)),
        );
        setFromDate("");
        setToDate("");
        setRangeTitle("");
        router.refresh();
      });
    } catch (rangeError) {
      setError(
        rangeError instanceof Error ? rangeError.message : labels.error,
      );
    }
  }

  return (
    <details className={cn("group", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronIcon className="h-4 w-4 group-open:rotate-180" />
        {labels.title}
      </summary>
      <div className="mt-3 space-y-6 rounded-lg border border-border p-4">
        <form className="space-y-3" onSubmit={handleAddSingle}>
          <p className="text-sm font-medium text-foreground">{labels.singleTitle}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">
                {labels.serviceDate}
              </label>
              <Input
                type="date"
                value={singleDate}
                onChange={(event) => setSingleDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                {labels.titleOptional}
              </label>
              <Input
                type="text"
                value={singleTitle}
                onChange={(event) => setSingleTitle(event.target.value)}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending || !singleDate}>
            {isPending ? labels.adding : labels.addDate}
          </Button>
        </form>

        <form className="space-y-3 border-t border-border pt-6" onSubmit={handleAddRange}>
          <p className="text-sm font-medium text-foreground">{labels.rangeTitle}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted">
                {labels.dateFrom}
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                {labels.dateTo}
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">
                {labels.titleOptional}
              </label>
              <Input
                type="text"
                value={rangeTitle}
                onChange={(event) => setRangeTitle(event.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={isPending || !fromDate || !toDate}
          >
            {isPending ? labels.adding : labels.addDateRange}
          </Button>
        </form>

        {message ? (
          <Alert variant="success" className="text-sm">
            {message}
          </Alert>
        ) : null}
        {error ? (
          <Alert variant="error" className="text-sm">
            {error}
          </Alert>
        ) : null}
      </div>
    </details>
  );
}
