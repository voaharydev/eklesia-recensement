import { getTranslations } from "next-intl/server";
import { NextResponse } from "next/server";

import { getHouseholdsExportDataset } from "@/app/actions/admin";
import { MAX_MEMBERS_EXPORT } from "@/lib/admin/export-limits";
import { getAdminSession } from "@/lib/admin/auth";
import {
  buildExportFilename,
  buildHouseholdsExportXlsxBuffer,
  buildHouseholdsExportZipBuffer,
} from "@/lib/admin/export-members";
import {
  parseMembersSearchParams,
  type MembersSearchParams,
} from "@/lib/admin/parse-members-search-params";

export const dynamic = "force-dynamic";

function parseExportFormat(value: string | null): "csv" | "xlsx" {
  return value === "csv" ? "csv" : "xlsx";
}

function searchParamsFromUrl(url: URL): MembersSearchParams {
  return {
    search: url.searchParams.get("search") ?? undefined,
    role: url.searchParams.get("role") ?? undefined,
    is_child: url.searchParams.get("is_child") ?? undefined,
    branch_code: url.searchParams.get("branch_code") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    updated_preset: url.searchParams.get("updated_preset") ?? undefined,
    updated_from: url.searchParams.get("updated_from") ?? undefined,
    updated_to: url.searchParams.get("updated_to") ?? undefined,
  };
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }

  const url = new URL(request.url);
  const format = parseExportFormat(url.searchParams.get("format"));
  const filters = parseMembersSearchParams(searchParamsFromUrl(url));

  const result = await getHouseholdsExportDataset(filters);
  if (result.error || !result.data) {
    const status = result.error?.includes(String(MAX_MEMBERS_EXPORT)) ? 400 : 500;
    return new NextResponse(result.error ?? "Erreur d'export.", { status });
  }

  const tRoles = await getTranslations({ locale: "fr", namespace: "admin.roles" });
  const roleLabels = {
    chef_de_famille: tRoles("chef_de_famille"),
    conjoint: tRoles("conjoint"),
    autre: tRoles("autre"),
    enfant: tRoles("enfant"),
  };

  const filename = buildExportFilename(format);

  if (format === "csv") {
    const body = new Uint8Array(
      await buildHouseholdsExportZipBuffer(result.data, roleLabels),
    );
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const body = new Uint8Array(
    buildHouseholdsExportXlsxBuffer(result.data, roleLabels),
  );
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
