"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { unregisterHouseholdAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type UnregisterHouseholdButtonProps = {
  householdId: string;
  labels: {
    button: string;
    buttonLoading: string;
    title: string;
    description: string;
    confirm: string;
    cancel: string;
    error: string;
  };
};

export function UnregisterHouseholdButton({
  householdId,
  labels,
}: UnregisterHouseholdButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsLoading(true);
    try {
      const result = await unregisterHouseholdAction(householdId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(labels.error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? labels.buttonLoading : labels.button}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={labels.title}
        description={labels.description}
        confirmLabel={isLoading ? labels.buttonLoading : labels.confirm}
        cancelLabel={labels.cancel}
        onConfirm={handleConfirm}
        confirmVariant="danger"
        isConfirming={isLoading}
      >
        {error ? (
          <p className="text-sm text-status-error" role="alert">
            {error}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
