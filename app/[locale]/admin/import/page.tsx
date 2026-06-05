import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { ExcelImportForm } from "@/components/admin/excel-import-form";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";

type AdminImportPageProps = {
  params: { locale: Locale };
};

export default async function AdminImportPage({
  params: { locale },
}: AdminImportPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.import");

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-xl">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {t("backToRegistration")}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("title")}</h1>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ExcelImportForm />
        </section>
      </main>
    </div>
  );
}
