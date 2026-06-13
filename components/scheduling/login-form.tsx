"use client";

import { useState, useTransition } from "react";

import { sendMagicLinkLogin } from "@/app/actions/scheduling";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/routing";

type LoginFormProps = {
  locale: Locale;
  authError?: boolean;
  labels: {
    emailLabel: string;
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    authError: string;
    genericError: string;
  };
};

export function LoginForm({ locale, authError, labels }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(
    authError ? labels.authError : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await sendMagicLinkLogin({ locale, email });
      if (result.error) {
        setError(result.error || labels.genericError);
        return;
      }
      setMessage(labels.success);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          {labels.emailLabel}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={labels.emailPlaceholder}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? labels.submitting : labels.submit}
      </Button>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
    </form>
  );
}
