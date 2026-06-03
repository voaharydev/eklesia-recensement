"use client";

import { useState } from "react";

type UnregisterHouseholdSectionProps = {
  onUnregister: () => Promise<void>;
  disabled?: boolean;
};

export function UnregisterHouseholdSection({
  onUnregister,
  disabled = false,
}: UnregisterHouseholdSectionProps) {
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);

    const confirmed = window.confirm(
      "Cette action retire votre foyer du recensement actif. Vos données restent archivées en base. Vous pourrez vous réinscrire plus tard avec le même courriel.\n\nContinuer ?",
    );

    if (!confirmed) return;

    setIsUnregistering(true);
    try {
      await onUnregister();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de désinscrire ce foyer.",
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
        Désinscrire le foyer
      </h3>
      <p className="mt-2 text-sm text-gray-600">
        Retire votre foyer du recensement actif sans supprimer l&apos;historique
        en base. Vous ne pourrez plus le modifier tant qu&apos;il n&apos;est pas
        réactivé par l&apos;administration.
      </p>

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
        {isUnregistering ? "Désinscription…" : "Désinscrire ce foyer"}
      </button>
    </section>
  );
}
