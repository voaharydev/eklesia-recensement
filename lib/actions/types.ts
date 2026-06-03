export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function success<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function failure<T>(message: string): ActionResult<T> {
  return { data: null, error: message };
}

export function mapSupabaseError(error: {
  message: string;
  code?: string;
}): string {
  if (error.code === "23503") {
    return "Référence invalide : le foyer associé n'existe pas.";
  }
  if (error.code === "23505") {
    return "Cet enregistrement existe déjà.";
  }
  return error.message || "Une erreur inattendue s'est produite.";
}
