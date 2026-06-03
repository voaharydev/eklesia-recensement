"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type UnregisterHouseholdSectionProps = {
  onUnregister: () => Promise<void>;
  disabled?: boolean;
};

export function UnregisterHouseholdSection({
  onUnregister,
  disabled = false,
}: UnregisterHouseholdSectionProps) {
  const t = useTranslations("wizard.unregister");
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    const confirmed = window.confirm(t("confirm"));

    if (!confirmed) return;

    setIsUnregistering(true);
    try {
      await onUnregister();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("error"),
      );
    } finally {
      setIsUnregistering(false);
    }
  }

  return (
    <section
      className="mt-8 border-t border-gray-200 pt-6"
      aria-labelledby="unregister-household-heading"
    >
      <h3
        id="unregister-household-heading"
        className="text-sm font-semibold text-gray-900"
      >
        {t("title")}
      </h3>
      <p className="mt-2 text-sm text-gray-600">{t("description")}</p>

      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUnregistering}
        className="mt-4 rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUnregistering ? t("buttonLoading") : t("button")}
      </button>
    </section>
  );
}
