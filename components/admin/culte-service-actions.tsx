"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  cancelService,
  deleteService,
  reactivateService,
} from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type CulteServiceActionsProps = {
  serviceId: string;
  isCancelled: boolean;
  labels: {
    cancelService: string;
    reactivateService: string;
    deleteService: string;
    cancelling: string;
    reactivating: string;
    deleting: string;
    cancelConfirm: string;
    deleteConfirm: string;
    cancelledBanner: string;
  };
};

export function CulteServiceActions({
  serviceId,
  isCancelled,
  labels,
}: CulteServiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (!window.confirm(labels.cancelConfirm)) return;

    setError(null);
    startTransition(async () => {
      const result = await cancelService({ serviceId });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleReactivate() {
    setError(null);
    startTransition(async () => {
      const result = await reactivateService({ serviceId });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteService({ serviceId });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/cultes");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {isCancelled ? (
        <Alert variant="info" className="text-sm">
          {labels.cancelledBanner}
        </Alert>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isCancelled ? (
          <Button
            type="button"
            size="sm"
            onClick={handleReactivate}
            disabled={isPending}
          >
            {isPending ? labels.reactivating : labels.reactivateService}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCancel}
            disabled={isPending}
          >
            {isPending ? labels.cancelling : labels.cancelService}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={handleDelete}
          disabled={isPending}
        >
          {isPending ? labels.deleting : labels.deleteService}
        </Button>
      </div>

      {error ? (
        <Alert variant="error" className="text-sm">
          {error}
        </Alert>
      ) : null}
    </div>
  );
}
