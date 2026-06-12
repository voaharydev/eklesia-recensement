import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { loginAdminAction } from "@/app/actions/admin";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminSession } from "@/lib/admin/auth";

type AdminLoginPageProps = {
  searchParams: { error?: string };
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  if (await getAdminSession()) {
    redirect("/admin");
  }

  const t = await getTranslations({ locale: "fr", namespace: "admin.login" });

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("description")}</p>
      </header>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">
            {t("formTitle")}
          </h2>
        </CardHeader>
        <CardContent>
          {searchParams.error ? (
            <Alert variant="error" className="mb-4">
              {searchParams.error}
            </Alert>
          ) : null}

          <form action={loginAdminAction} className="space-y-4">
            <div>
              <label
                htmlFor="admin-token"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {t("tokenLabel")}
              </label>
              <Input
                id="admin-token"
                name="token"
                type="password"
                autoComplete="off"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
