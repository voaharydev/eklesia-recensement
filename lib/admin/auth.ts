import "server-only";

import { cookies } from "next/headers";

import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  verifyAdminSessionCookie,
  verifyAdminToken,
} from "@/lib/admin/token";

export { ADMIN_SESSION_COOKIE, verifyAdminToken };

export async function setAdminSessionCookie(): Promise<void> {
  const value = createAdminSessionValue();
  if (!value) {
    throw new Error("IMPORT_ADMIN_TOKEN is not configured.");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionCookie(value);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function assertAdminSession(): Promise<void> {
  const valid = await getAdminSession();
  if (!valid) {
    throw new Error("Unauthorized");
  }
}
