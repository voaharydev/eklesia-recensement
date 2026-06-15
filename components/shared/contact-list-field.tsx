"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/cn";

type ContactListFieldProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  type?: "email" | "tel";
  addLabel: string;
  removeLabel: string;
  error?: string;
  className?: string;
};

export function ContactListField({
  label,
  values,
  onChange,
  type = "email",
  addLabel,
  removeLabel,
  error,
  className,
}: ContactListFieldProps) {
  function updateValue(index: number, value: string) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function addRow() {
    onChange([...values, ""]);
  }

  function removeRow(index: number) {
    if (values.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-2">
            <Input
              type={type}
              value={value}
              hasError={Boolean(error)}
              onChange={(event) => updateValue(index, event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => removeRow(index)}
              aria-label={removeLabel}
            >
              {removeLabel}
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        {addLabel}
      </Button>
      {error ? <p className="text-sm text-status-error">{error}</p> : null}
    </div>
  );
}
