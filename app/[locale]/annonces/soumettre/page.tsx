import { getTranslations, setRequestLocale } from "next-intl/server";

import { SubmitAnnouncementForm } from "@/components/announcements/submit-announcement-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/i18n/routing";

type SubmitAnnouncementPageProps = {
  params: { locale: Locale };
};

export default async function SubmitAnnouncementPage({
  params: { locale },
}: SubmitAnnouncementPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations("announcements.submit");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <header className="flex flex-col gap-2 text-center sm:text-left">
            <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
            <p className="text-sm text-muted">{t("description")}</p>
          </header>
          <LanguageSwitcher className="shrink-0 self-center sm:self-start" />
        </div>
        <SubmitAnnouncementForm />
      </main>
    </div>
  );
}
