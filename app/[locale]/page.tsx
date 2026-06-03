import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import type { Locale } from "@/i18n/routing";

type HomeProps = {
  params: { locale: Locale };
  searchParams?: { email?: string | string[] };
};

export default async function Home({ params: { locale }, searchParams }: HomeProps) {
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const rawEmail = searchParams?.email;
  const initialEmail =
    typeof rawEmail === "string" ? decodeURIComponent(rawEmail).trim() : "";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-3xl">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {t("title")}
            </h1>
            <blockquote className="mt-4 border-l-4 border-indigo-200 pl-4 text-sm text-gray-600">
              <p className="italic">{t("verse.text")}</p>
              <footer className="mt-2 font-medium not-italic text-gray-500">
                — {t("verse.reference")}
              </footer>
            </blockquote>
            <p className="mt-4 text-gray-600">{t("intro")}</p>
          </div>
          <LanguageSwitcher className="shrink-0 self-center sm:self-start" />
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <RegistrationWizard initialEmail={initialEmail} locale={locale} />
        </section>
      </main>
    </div>
  );
}
