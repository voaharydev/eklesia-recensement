import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

import { LoginForm } from "@/components/scheduling/login-form";
import type { Locale } from "@/i18n/routing";

type LoginPageProps = {
  params: { locale: Locale };
  searchParams?: { error?: string };
};

export default async function LoginPage({
  params: { locale },
  searchParams,
}: LoginPageProps) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "scheduling.login" });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 font-[family-name:var(--font-geist-sans)]">
      <main className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("description")}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <LoginForm
            locale={locale}
            authError={searchParams?.error === "auth"}
            labels={{
              emailLabel: t("emailLabel"),
              emailPlaceholder: t("emailPlaceholder"),
              submit: t("submit"),
              submitting: t("submitting"),
              success: t("success"),
              authError: t("authError"),
              genericError: t("genericError"),
            }}
          />
        </div>
      </main>
    </div>
  );
}
