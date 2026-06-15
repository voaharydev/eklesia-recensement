import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminSession } from "@/lib/admin/auth";

import "../globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const messages = (await import("../../messages/fr.json")).default;
  const t = await getTranslations({ locale: "fr", namespace: "admin.nav" });
  const session = await getAdminSession();

  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gray-50 antialiased`}
      >
        <NextIntlClientProvider locale="fr" messages={messages}>
          {session ? (
            <AdminNav
              labels={{
                title: t("title"),
                dashboard: t("dashboard"),
                members: t("members"),
                cultes: t("cultes"),
                communication: t("communication"),
                announcements: t("announcements"),
                doublons: t("doublons"),
                importExcel: t("importExcel"),
                logout: t("logout"),
              }}
            />
          ) : null}
          <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

