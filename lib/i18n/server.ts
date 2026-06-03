import { getTranslations } from "next-intl/server";

import { parseLocale } from "@/lib/i18n/locale";
import {
  createFormatZodError,
  createHumanizeZodFieldMessage,
} from "@/lib/validations/format-zod-error";
import { createRegistrationSchemas } from "@/lib/validations/create-schemas";

export async function getServerI18n(localeInput: string) {
  const locale = parseLocale(localeInput);

  const validation = await getTranslations({ locale, namespace: "validation" });
  const errors = await getTranslations({ locale, namespace: "errors" });

  const tValidation = (key: string, values?: Record<string, string | number>) =>
    validation(key, values);

  return {
    locale,
    tValidation,
    tErrors: (key: string, values?: Record<string, string | number>) =>
      errors(key, values),
    schemas: createRegistrationSchemas(tValidation),
    formatZodError: createFormatZodError(tValidation),
    humanizeZodFieldMessage: createHumanizeZodFieldMessage(tValidation),
  };
}
