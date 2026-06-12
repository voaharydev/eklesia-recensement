import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { ExcelImportForm } from "@/components/admin/excel-import-form";
import { Card } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <main className="mx-auto max-w-2xl">
        <header className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            {t("backToRegistration")}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("title")}</h1>
        </header>

        <Card>
          <ExcelImportForm />
        </Card>
      </main>
    </div>
  );
}
