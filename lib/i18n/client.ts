"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  createHumanizeZodFieldMessage,
} from "@/lib/validations/format-zod-error";
import { createRegistrationSchemas } from "@/lib/validations/create-schemas";

export function useRegistrationSchemas() {
  const t = useTranslations("validation");

  return useMemo(() => {
    const translator = (key: string, values?: Record<string, string | number>) =>
      t(key, values);

    return {
      schemas: createRegistrationSchemas(translator),
      humanizeZodFieldMessage: createHumanizeZodFieldMessage(translator),
    };
  }, [t]);
}
