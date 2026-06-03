export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function success<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function failure<T>(message: string): ActionResult<T> {
  return { data: null, error: message };
}

type ErrorTranslator = (key: string) => string;

export function mapSupabaseError(
  error: { message: string; code?: string },
  t: ErrorTranslator,
): string {
  if (error.code === "23503") {
    return t("fkInvalid");
  }
  if (error.code === "23505") {
    return t("duplicate");
  }
  return error.message || t("unexpected");
}
