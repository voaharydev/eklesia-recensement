import { NextResponse } from "next/server";

import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { routing } from "@/i18n/routing";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const localeParam = searchParams.get("locale");
  const locale = routing.locales.includes(localeParam as "fr" | "mg")
    ? localeParam
    : routing.defaultLocale;

  if (code) {
    const supabase = await createServerAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/${locale}/mon-planning`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login?error=auth`);
}
