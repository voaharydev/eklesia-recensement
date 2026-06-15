export const CULTES_SORT_OPTIONS = [
  "date_asc",
  "date_desc",
  "title_asc",
  "title_desc",
] as const;

export type CultesSort = (typeof CULTES_SORT_OPTIONS)[number];

export const CULTES_PROGRESS_OPTIONS = [
  "all",
  "draft",
  "pending",
  "declined",
] as const;

export type CultesProgressFilter = (typeof CULTES_PROGRESS_OPTIONS)[number];

export type CultesSearchParams = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  progress?: string;
  showCancelled?: string;
};

export type CultesFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sort: CultesSort;
  progress: CultesProgressFilter;
  includeCancelled: boolean;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function parseSort(value?: string): CultesSort {
  if (value && CULTES_SORT_OPTIONS.includes(value as CultesSort)) {
    return value as CultesSort;
  }
  return "date_asc";
}

function parseProgress(value?: string): CultesProgressFilter {
  if (value && CULTES_PROGRESS_OPTIONS.includes(value as CultesProgressFilter)) {
    return value as CultesProgressFilter;
  }
  return "all";
}

export function parseCultesSearchParams(
  searchParams: CultesSearchParams,
): CultesFilters {
  const search = searchParams.search?.trim();
  return {
    search: search || undefined,
    dateFrom: parseIsoDate(searchParams.dateFrom),
    dateTo: parseIsoDate(searchParams.dateTo),
    sort: parseSort(searchParams.sort),
    progress: parseProgress(searchParams.progress),
    includeCancelled: searchParams.showCancelled === "1",
  };
}

export function hasActiveCultesFilters(filters: CultesFilters): boolean {
  return Boolean(
    filters.search ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.progress !== "all" ||
      filters.sort !== "date_asc" ||
      filters.includeCancelled,
  );
}

export function cultesFiltersToSearchParams(
  filters: CultesFilters,
): Record<string, string | undefined> {
  return {
    search: filters.search,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: filters.sort === "date_asc" ? undefined : filters.sort,
    progress: filters.progress === "all" ? undefined : filters.progress,
    showCancelled: filters.includeCancelled ? "1" : undefined,
  };
}
