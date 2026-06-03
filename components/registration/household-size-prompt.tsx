"use client";

import { useState } from "react";

type HouseholdSizePromptProps = {
  onApply: (adultCount: number, childCount: number) => void;
};

export function HouseholdSizePrompt({ onApply }: HouseholdSizePromptProps) {
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="text-sm font-semibold text-blue-900">
        Combien de personnes dans votre foyer ?
      </h3>
      <p className="mt-1 text-sm text-blue-800">
        Indiquez le nombre d&apos;adultes et d&apos;enfants pour préparer le
        formulaire en une fois.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-800">Adultes (16 ans et +)</span>
          <input
            type="number"
            min={1}
            max={20}
            value={adultCount}
            onChange={(e) =>
              setAdultCount(Math.max(1, Number.parseInt(e.target.value, 10) || 1))
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-gray-800">Enfants (15 ans et −)</span>
          <input
            type="number"
            min={0}
            max={20}
            value={childCount}
            onChange={(e) =>
              setChildCount(Math.max(0, Number.parseInt(e.target.value, 10) || 0))
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => onApply(adultCount, childCount)}
        className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Préparer le formulaire
      </button>
    </div>
  );
}
