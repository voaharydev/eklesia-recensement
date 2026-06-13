import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";
import {
  hasSupabaseSession,
  updateSession,
} from "@/lib/supabase/middleware-auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const MEMBER_LOCALE_PATTERN = /^\/(mg|fr)\/mon-planning\/?$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  if (MEMBER_LOCALE_PATTERN.test(pathname)) {
    const locale = pathname.split("/")[1] ?? routing.defaultLocale;
    const loggedIn = await hasSupabaseSession(request);

    if (!loggedIn) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    return updateSession(request);
  }

  if (pathname.match(/^\/(mg|fr)\/login\/?$/)) {
    return updateSession(request);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/",
    "/(mg|fr)/:path*",
    "/admin",
    "/admin/:path*",
    "/auth/callback",
  ],
};
