export const BRANCH_OPTIONS = [
  { code: "sekoly_alahady", label: "Sekoly Alahady" },
  { code: "sampati", label: "Sampati" },
  { code: "aff", label: "AFF" },
  { code: "safif", label: "Safif" },
  { code: "slk", label: "SLK" },
  { code: "dorkasy", label: "Dorkasy" },
  { code: "fimpiz", label: "Fimpiz" },
  { code: "vaomiera_fananana", label: "Vaomiera Fananana" },
  { code: "vaomiera_vola", label: "Vaomiera Vola" },
  { code: "vaomiera_technika", label: "Vaomiera Technika" },
  { code: "fdl", label: "FDL" },
  { code: "stk", label: "STK" },
  { code: "vaomiera_hazakazaka_masina", label: "Vaomiera Hazakazaka Masina" },
  { code: "miako_fiderana", label: "Miako Fiderana" },
] as const;

export type BranchCode = (typeof BRANCH_OPTIONS)[number]["code"];

export const BRANCH_CODES: [BranchCode, ...BranchCode[]] = BRANCH_OPTIONS.map(
  (b) => b.code,
) as [BranchCode, ...BranchCode[]];

/** Anciens codes (migration / seed de démo) → codes actuels. */
export const LEGACY_BRANCH_CODE_MAP: Partial<Record<string, BranchCode>> = {
  ankadifotsy: "sekoly_alahady",
  toamasina_centre: "sampati",
};

export function getBranchLabel(code: string): string {
  const found = BRANCH_OPTIONS.find((b) => b.code === code);
  return found?.label ?? code;
}

export function resolveBranchCode(code: string): BranchCode | null {
  if ((BRANCH_CODES as readonly string[]).includes(code)) {
    return code as BranchCode;
  }
  return LEGACY_BRANCH_CODE_MAP[code] ?? null;
}

/** Map legacy seed text values to branch codes. */
export function legacyBranchTextToCode(
  text: string | null | undefined,
): BranchCode | null {
  if (!text?.trim()) return null;
  const normalized = text.trim();
  const byLabel = BRANCH_OPTIONS.find((b) => b.label === normalized);
  if (byLabel) return byLabel.code;
  return null;
}
