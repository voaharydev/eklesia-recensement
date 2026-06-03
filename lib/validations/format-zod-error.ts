import type { ZodError } from "zod";

import type { ValidationTranslator } from "@/lib/validations/create-schemas";

export function createHumanizeZodFieldMessage(t: ValidationTranslator) {
  return (message: string, fieldPath?: string): string => {
    if (!message.startsWith("Invalid input")) {
      return message;
    }

    const path = fieldPath ?? "";

    if (path.endsWith("email") || path.includes(".email")) {
      if (message.includes("undefined") || message.includes("null")) {
        return t("invalidInputEmailRequired");
      }
      return t("invalidInputEmailInvalid");
    }

    if (path.endsWith("id") || path.includes(".id")) {
      return t("invalidInputPersonId");
    }

    if (message.includes("undefined") || message.includes("null")) {
      return t("invalidInputRequired");
    }

    return t("invalidInputGeneric");
  };
}

export function createFormatZodError(t: ValidationTranslator) {
  const humanize = createHumanizeZodFieldMessage(t);

  return (error: ZodError): string => {
    const issue = error.issues[0];
    if (!issue) {
      return t("invalidData");
    }

    const path = issue.path.join(".");
    return humanize(issue.message, path);
  };
}
