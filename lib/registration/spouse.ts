export function isSpouseFilled(
  spouse: { first_name?: string; last_name?: string } | undefined,
): boolean {
  if (!spouse) return false;
  return Boolean(spouse.first_name?.trim() || spouse.last_name?.trim());
}

export function optionalTextToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
