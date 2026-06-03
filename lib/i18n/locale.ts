import { z } from "zod";

import { routing, type Locale } from "@/i18n/routing";

export const localeSchema = z.enum(routing.locales);

export function parseLocale(value: unknown): Locale {
  const parsed = localeSchema.safeParse(value);
  return parsed.success ? parsed.data : routing.defaultLocale;
}
