"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { importExcelFromUpload } from "@/app/actions/import-excel";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ImportPersistResult } from "@/lib/import/types";

export function ExcelImportForm() {
  const t = useTranslations("admin.import");
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [sheetName, setSheetName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [report, setReport] = useState<ImportPersistResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    setReport(null);

    if (!file) {
      setServerError(t("errors.noFile"));
      return;
    }

    setIsSubmitting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fileBase64 = btoa(binary);

      const result = await importExcelFromUpload({
        token,
        confirmReplace,
        dryRun,
        sheetName: sheetName.trim() || undefined,
        fileBase64,
      });

      if (result.error) {
        setServerError(result.error);
      }

      if (result.data) {
        setReport(result.data);
      }
    } catch {
      setServerError(t("errors.unexpected"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <p className="text-sm text-gray-600">{t("description")}</p>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-gray-800">{t("tokenLabel")}</span>
        <Input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-gray-800">{t("fileLabel")}</span>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="min-h-[44px] text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-gray-800">{t("sheetLabel")}</span>
        <Input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          placeholder={t("sheetPlaceholder")}
        />
      </label>

      <label className="flex min-h-[44px] items-center gap-3 text-sm text-gray-700">
        <Checkbox
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
        />
        {t("dryRun")}
      </label>

      <label className="flex min-h-[44px] items-start gap-3 text-sm text-gray-700">
        <Checkbox
          checked={confirmReplace}
          onChange={(e) => setConfirmReplace(e.target.checked)}
          disabled={dryRun}
          className="mt-0.5"
        />
        <span>{t("confirmReplace")}</span>
      </label>

      {serverError ? (
        <Alert variant="error">{serverError}</Alert>
      ) : null}

      {report ? (
        <Alert variant="info">
          <p className="font-medium">{t("reportTitle")}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              {t("reportSheet")}: {report.sheetName}
            </li>
            <li>
              {t("reportRows")}: {report.totalExcelRows}
            </li>
            <li>
              {t("reportHouseholds")}: {report.households}
            </li>
            <li>
              {t("reportPersons")}: {report.persons}
            </li>
            <li>
              {t("reportPersisted")}:{" "}
              {report.persisted ? t("yes") : t("no")}
            </li>
          </ul>
          {report.warnings.length > 0 ? (
            <div className="mt-3">
              <p className="font-medium text-amber-800">{t("warnings")}</p>
              <ul className="mt-1 list-inside list-disc text-amber-900">
                {report.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {report.errors.length > 0 ? (
            <div className="mt-3">
              <p className="font-medium text-red-800">{t("errorsTitle")}</p>
              <ul className="mt-1 max-h-48 list-inside list-disc overflow-y-auto text-red-900">
                {report.errors.map((e) => (
                  <li key={`${e.excelRowNumber}-${e.message}`}>
                    {t("errorLine", {
                      line: e.excelRowNumber,
                      message: e.message,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Alert>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
