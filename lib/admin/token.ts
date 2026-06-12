import { createHmac, timingSafeEqual } from "crypto";

import { ADMIN_SESSION_COOKIE } from "@/lib/admin/constants";

export { ADMIN_SESSION_COOKIE };

const SESSION_SALT = "admin_session";

function getAdminToken(): string | null {
  const token = process.env.IMPORT_ADMIN_TOKEN?.trim();
  if (!token || token.length < 8) return null;
  return token;
}

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyAdminToken(token: string): boolean {
  const expected = getAdminToken();
  if (!expected) return false;
  return secureCompare(token.trim(), expected);
}

export function createAdminSessionValue(): string {
  const token = getAdminToken();
  if (!token) return "";
  return createHmac("sha256", token).update(SESSION_SALT).digest("hex");
}

export function verifyAdminSessionCookie(
  cookieValue: string | undefined,
): boolean {
  if (!cookieValue) return false;
  const expected = createAdminSessionValue();
  if (!expected) return false;
  return secureCompare(cookieValue, expected);
}
