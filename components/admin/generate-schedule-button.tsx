"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { generateYearlySchedule } from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type GenerateScheduleButtonProps = {
  year: number;
  labels: {
    generate: string;
    generating: string;
    success: string;
  };
};

export function GenerateScheduleButton({
  year,
  labels,
}: GenerateScheduleButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await generateYearlySchedule({ year });
      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.data) return;

      const { createdServices, skippedServices } = result.data;
      setMessage(
        `${labels.success} (${createdServices} créés, ${skippedServices} ignorés)`,
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        size="sm"
      >
        {isPending ? labels.generating : labels.generate}
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
