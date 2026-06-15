"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { searchHouseholds } from "@/app/actions/communication";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";
import type { HouseholdSearchResult } from "@/types/communication";

type HouseholdSearchFieldProps = {
  defaultHouseholdId?: string;
  defaultHouseholdName?: string;
  labels: {
    label: string;
    placeholder: string;
    clear: string;
    loading: string;
    noResults: string;
  };
  onChange?: () => void;
};

export function HouseholdSearchField({
  defaultHouseholdId = "",
  defaultHouseholdName = "",
  labels,
  onChange,
}: HouseholdSearchFieldProps) {
  const [query, setQuery] = useState(defaultHouseholdName);
  const [householdId, setHouseholdId] = useState(defaultHouseholdId);
  const [householdName, setHouseholdName] = useState(defaultHouseholdName);
  const [results, setResults] = useState<HouseholdSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback((value: string) => {
    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      const result = await searchHouseholds({ query: value.trim() });
      if (result.error || !result.data) {
        setResults([]);
        setIsOpen(true);
        return;
      }
      setResults(result.data);
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setHouseholdId("");
    setHouseholdName("");

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runSearch(value);
    }, 300);
  }

  function selectHousehold(household: HouseholdSearchResult) {
    setQuery(household.name);
    setHouseholdId(household.id);
    setHouseholdName(household.name);
    setIsOpen(false);
    window.setTimeout(() => onChange?.(), 0);
  }

  function clearSelection() {
    setQuery("");
    setHouseholdId("");
    setHouseholdName("");
    setResults([]);
    setIsOpen(false);
    window.setTimeout(() => onChange?.(), 0);
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor="communication-household-search"
        className="mb-1 block text-sm font-medium text-foreground"
      >
        {labels.label}
      </label>
      <div className="flex gap-2">
        <Input
          id="communication-household-search"
          type="search"
          value={query}
          placeholder={labels.placeholder}
          autoComplete="off"
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {householdId ? (
          <button
            type="button"
            className="shrink-0 text-sm text-muted hover:text-foreground"
            onClick={clearSelection}
          >
            {labels.clear}
          </button>
        ) : null}
      </div>
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="householdName" value={householdName} />

      {isOpen ? (
        <ul
          className={cn(
            "absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-card",
          )}
          role="listbox"
        >
          {isPending ? (
            <li className="px-3 py-2 text-sm text-muted">{labels.loading}</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">{labels.noResults}</li>
          ) : (
            results.map((household) => (
              <li key={household.id}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  onClick={() => selectHousehold(household)}
                >
                  {household.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
