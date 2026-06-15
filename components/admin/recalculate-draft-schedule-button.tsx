"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recalculateUpcomingDraftSchedules } from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RecalculateDraftScheduleButtonProps = {
  labels: {
    recalculate: string;
    recalculating: string;
    confirm: string;
    success: string;
  };
};

export function RecalculateDraftScheduleButton({
  labels,
}: RecalculateDraftScheduleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleRecalculate() {
    if (!window.confirm(labels.confirm)) {
      return;
    }

    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await recalculateUpcomingDraftSchedules();
      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.data) return;

      const { updatedServices, skippedServices } = result.data;
      setMessage(
        `${labels.success} (${updatedServices} recalculés, ${skippedServices} ignorés)`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        variant="secondary"
        onClick={handleRecalculate}
        disabled={isPending}
        size="sm"
      >
        {isPending ? labels.recalculating : labels.recalculate}
      </Button>
      {message ? (
        <Alert variant="success" className="max-w-md text-sm">
          {message}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="error" className="max-w-md text-sm">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
