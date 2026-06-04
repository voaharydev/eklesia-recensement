import { setRequestLocale } from "next-intl/server";

import { RegistrationPageShell } from "@/components/registration/registration-page-shell";
import type { Locale } from "@/i18n/routing";

type HomeProps = {
  params: { locale: Locale };
  searchParams?: { email?: string | string[] };
};

export default async function Home({ params: { locale }, searchParams }: HomeProps) {
  setRequestLocale(locale);

  const rawEmail = searchParams?.email;
  const initialEmail =
    typeof rawEmail === "string" ? decodeURIComponent(rawEmail).trim() : "";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-3xl">
        <RegistrationPageShell locale={locale} initialEmail={initialEmail} />
      </main>
    </div>
  );
}
