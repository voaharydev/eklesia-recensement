"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { importExcelFromUpload } from "@/app/actions/import-excel";
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
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
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
          className="text-sm text-gray-700"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-gray-800">{t("sheetLabel")}</span>
        <input
          type="text"
          value={sheetName}
          onChange={(e) => setSheetName(e.target.value)}
          placeholder={t("sheetPlaceholder")}
          className="rounded-md border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={dryRun}
          onChange={(e) => setDryRun(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        {t("dryRun")}
      </label>

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={confirmReplace}
          onChange={(e) => setConfirmReplace(e.target.checked)}
          disabled={dryRun}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        <span>{t("confirmReplace")}</span>
      </label>

      {serverError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      {report ? (
        <div
          className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800"
          role="status"
        >
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
              <ul className="mt-1 max-h-48 overflow-y-auto list-inside list-disc text-red-900">
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
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
