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
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {t("title")}
          </h1>
          <blockquote className="mt-3 line-clamp-2 border-l-4 border-indigo-200 pl-4 text-sm text-gray-600 sm:line-clamp-none">
            <p className="italic">{t("verse.text")}</p>
            <footer className="mt-1 font-medium not-italic text-gray-500">
              — {t("verse.reference")}
            </footer>
          </blockquote>
          <HomeIntro />
        </div>
        <LanguageSwitcher className="shrink-0 self-center sm:self-start" />
      </header>

      <section className="card p-6 sm:p-8">
        <RegistrationWizard initialEmail={initialEmail} locale={locale} />
      </section>
    </RegistrationWizardProvider>
  );
}
