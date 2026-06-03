import type { ZodError } from "zod";

/** Messages génériques Zod 4 (souvent en anglais) → libellés français. */
export function humanizeZodFieldMessage(
  message: string,
  fieldPath?: string,
): string {
  if (!message.startsWith("Invalid input")) {
    return message;
  }

  const path = fieldPath ?? "";

  if (path.endsWith("email") || path.includes(".email")) {
    if (message.includes("undefined") || message.includes("null")) {
      return "Le courriel est requis.";
    }
    return "Adresse e-mail invalide.";
  }

  if (path.endsWith("id") || path.includes(".id")) {
    return "Identifiant de personne invalide.";
  }

  if (message.includes("undefined") || message.includes("null")) {
    return "Ce champ est requis.";
  }

  return "Valeur invalide. Vérifiez ce champ.";
}

export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Données invalides.";
  }

  const path = issue.path.join(".");
  return humanizeZodFieldMessage(issue.message, path);
}
