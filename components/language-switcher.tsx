"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/routing";

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-gray-500">{t("label")}</p>
      <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
        <Link
          href={pathname}
          locale="mg"
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            locale === "mg"
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t("mg")}
        </Link>
        <Link
          href={pathname}
          locale="fr"
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            locale === "fr"
              ? "bg-indigo-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t("fr")}
        </Link>
      </div>
    </div>
  );
}
