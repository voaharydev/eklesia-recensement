"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { signOutMember } from "@/app/actions/scheduling";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  locale: string;
  label: string;
};

export function SignOutButton({ locale, label }: SignOutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(async () => {
      await signOutMember();
      router.push(`/${locale}/login`);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={isPending}
      onClick={handleSignOut}
    >
      {label}
    </Button>
  );
}
