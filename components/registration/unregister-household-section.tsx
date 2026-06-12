"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type UnregisterHouseholdSectionProps = {
  onUnregister: () => Promise<void>;
  disabled?: boolean;
  variant?: "section" | "link";
};

export function UnregisterHouseholdSection({
  onUnregister,
  disabled = false,
  variant = "section",
}: UnregisterHouseholdSectionProps) {
  const t = useTranslations("wizard.unregister");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    setIsUnregistering(true);
    try {
      await onUnregister();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsUnregistering(false);
    }
  }

  const dialog = (
    <Dialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      title={t("title")}
      description={t("confirmDescription")}
      confirmLabel={isUnregistering ? t("buttonLoading") : t("button")}
      cancelLabel={t("cancel")}
      onConfirm={handleConfirm}
      confirmVariant="danger"
      isConfirming={isUnregistering}
    >
      {error ? (
        <p className="text-sm text-status-error" role="alert">
          {error}
        </p>
      ) : null}
    </Dialog>
  );

  if (variant === "link") {
    return (
      <>
        <div className="mt-6 border-t border-border pt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDialogOpen(true)}
            disabled={disabled || isUnregistering}
            className="text-gray-500 hover:text-red-700"
          >
            {t("link")}
          </Button>
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <section
        className="mt-8 border-t border-border pt-6"
        aria-labelledby="unregister-household-heading"
      >
        <h3
          id="unregister-household-heading"
          className="text-sm font-semibold text-gray-900"
        >
          {t("title")}
        </h3>
        <p className="mt-2 text-sm text-gray-600">{t("description")}</p>

        <Button
          type="button"
          variant="danger"
          onClick={() => setDialogOpen(true)}
          disabled={disabled || isUnregistering}
          className="mt-4"
        >
          {isUnregistering ? t("buttonLoading") : t("button")}
        </Button>
      </section>
      {dialog}
    </>
  );
}
