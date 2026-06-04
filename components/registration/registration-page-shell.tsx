"use client";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/language-switcher";
import { HomeIntro } from "@/components/registration/home-intro";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import type { Locale } from "@/i18n/routing";
import { RegistrationWizardProvider } from "@/lib/registration/wizard-state-context";

type RegistrationPageShellProps = {
  locale: Locale;
  initialEmail?: string;
};

export function RegistrationPageShell({
  locale,
  initialEmail = "",
}: RegistrationPageShellProps) {
  const t = useTranslations("home");

  return (
    <RegistrationWizardProvider>
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
          <HomeIntro />
        </div>
        <LanguageSwitcher className="shrink-0 self-center sm:self-start" />
      </header>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <RegistrationWizard initialEmail={initialEmail} locale={locale} />
      </section>
    </RegistrationWizardProvider>
  );
}
