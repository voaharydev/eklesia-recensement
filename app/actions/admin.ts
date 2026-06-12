"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  assertAdminSession,
  clearAdminSession,
  getAdminSession,
  setAdminSessionCookie,
  verifyAdminToken,
} from "@/lib/admin/auth";
import { groupPersonsForAdmin } from "@/lib/admin/person-sort";
import type {
  DashboardMetrics,
  ExportScopeCounts,
  GroupedHouseholdMembers,
  HouseholdDetail,
  HouseholdsExportDataset,
  MembersFilters,
  PaginatedMembers,
  PersonWithHousehold,
} from "@/lib/admin/types";
import { MAX_MEMBERS_EXPORT } from "@/lib/admin/export-limits";
import { resolveUpdatedFilter } from "@/lib/admin/updated-filter";
import { createChild, updateChild } from "@/app/actions/person";
import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { getServerI18n } from "@/lib/i18n/server";
import { localeSchema } from "@/lib/i18n/locale";
import { validateHouseholdRoles } from "@/lib/registration/household-role";
import {
  flattenHouseholdPersonsForm,
  memberFormValuesToPersonInsert,
} from "@/lib/registration/mappers";
import { optionalTextToNull } from "@/lib/registration/spouse";
import { resolveBranchCode } from "@/lib/constants/branches";
import { createAdminClient } from "@/lib/supabase/supabase";
import type { Household, Person } from "@/types/database";

const ACTIVE_PERSON_SELECT =
  "*, household:households!inner(id, name, unregistered_at, updated_at, created_at)";

const FILTERED_HOUSEHOLD_ID_SELECT =
  "household_id, household:households!inner(unregistered_at, updated_at, created_at)";

const EXPORT_BATCH_SIZE = 1000;
const HOUSEHOLD_ID_CHUNK_SIZE = 200;

const localePayloadSchema = z.object({
  locale: localeSchema,
});

type MembersFilterOptions = {
  searchHouseholdIds?: string[];
  neverUpdatedHouseholdIds?: string[];
};

function escapeIlike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

function quotePostgrestValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function requireAdmin(): Promise<ActionResult<never> | null> {
  try {
    await assertAdminSession();
    return null;
  } catch {
    return failure("Session admin invalide ou expirée.");
  }
}

function applyMembersFilters(
  query: ReturnType<
    ReturnType<typeof createAdminClient>["from"]
  >,
  filters: MembersFilters,
  options?: {
    searchHouseholdIds?: string[];
    neverUpdatedHouseholdIds?: string[];
  },
) {
  let q = query;
  const searchHouseholdIds = options?.searchHouseholdIds;
  const neverUpdatedHouseholdIds = options?.neverUpdatedHouseholdIds;

  if (filters.status === "active") {
    q = q.is("household.unregistered_at", null);
  } else if (filters.status === "archived") {
    q = q.not("household.unregistered_at", "is", null);
  } else {
    q = q.is("household.unregistered_at", null);
  }

  if (filters.role) {
    q = q.eq("role", filters.role);
  }

  if (filters.is_child !== undefined) {
    q = q.eq("is_child", filters.is_child);
  }

  if (filters.branch_code) {
    // jsonb @> requires JSON text; a JS array would be encoded as a Postgres array ({...}).
    q = q.contains(
      "branches",
      JSON.stringify([{ branch_code: filters.branch_code }]),
    );
  }

  const updatedFilter = resolveUpdatedFilter(filters);
  if (updatedFilter?.mode === "range") {
    if (updatedFilter.gte) {
      q = q.gte("household.updated_at", updatedFilter.gte);
    }
    if (updatedFilter.lte) {
      q = q.lte("household.updated_at", updatedFilter.lte);
    }
  } else if (updatedFilter?.mode === "never") {
    if (!neverUpdatedHouseholdIds || neverUpdatedHouseholdIds.length === 0) {
      q = q.eq("household_id", "00000000-0000-0000-0000-000000000000");
    } else {
      q = q.in("household_id", neverUpdatedHouseholdIds);
    }
  }

  const search = filters.search?.trim();
  if (search) {
    const pattern = quotePostgrestValue(`%${escapeIlike(search)}%`);
    const orParts = [
      `first_name.ilike.${pattern}`,
      `last_name.ilike.${pattern}`,
      `email.ilike.${pattern}`,
    ];
    if (searchHouseholdIds && searchHouseholdIds.length > 0) {
      const inList = searchHouseholdIds
        .map((id) => quotePostgrestValue(id))
        .join(",");
      orParts.push(`household_id.in.(${inList})`);
    }
    q = q.or(orParts.join(","));
  }

  return q;
}

async function resolveSearchHouseholdIds(
  supabase: ReturnType<typeof createAdminClient>,
  search: string,
  status: MembersFilters["status"],
): Promise<string[]> {
  const pattern = `%${escapeIlike(search)}%`;
  let query = supabase.from("households").select("id").ilike("name", pattern);

  if (status === "archived") {
    query = query.not("unregistered_at", "is", null);
  } else {
    query = query.is("unregistered_at", null);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => row.id);
}

async function resolveNeverUpdatedHouseholdIds(
  supabase: ReturnType<typeof createAdminClient>,
  status: MembersFilters["status"],
): Promise<string[]> {
  let query = supabase
    .from("households")
    .select("id, created_at, updated_at");

  if (status === "archived") {
    query = query.not("unregistered_at", "is", null);
  } else {
    query = query.is("unregistered_at", null);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((row) => {
      const createdAt = new Date(row.created_at).getTime();
      const updatedAt = new Date(row.updated_at).getTime();
      return Math.abs(updatedAt - createdAt) <= 60_000;
    })
    .map((row) => row.id);
}

async function prepareMembersFilterOptions(
  supabase: ReturnType<typeof createAdminClient>,
  filters: MembersFilters,
): Promise<MembersFilterOptions> {
  const options: MembersFilterOptions = {};

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    options.searchHouseholdIds = await resolveSearchHouseholdIds(
      supabase,
      searchTerm,
      filters.status,
    );
  }

  const updatedFilter = resolveUpdatedFilter(filters);
  if (updatedFilter?.mode === "never") {
    options.neverUpdatedHouseholdIds = await resolveNeverUpdatedHouseholdIds(
      supabase,
      filters.status,
    );
  }

  return options;
}

function buildFilteredMembersQuery(
  supabase: ReturnType<typeof createAdminClient>,
  filters: MembersFilters,
  options: MembersFilterOptions,
  personSelect: string = ACTIVE_PERSON_SELECT,
  selectOptions?: { count?: "exact"; head?: boolean },
) {
  let query = supabase.from("persons").select(personSelect, selectOptions);

  query = applyMembersFilters(query, filters, options);

  return query
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });
}

async function resolveFilteredHouseholdIds(
  supabase: ReturnType<typeof createAdminClient>,
  filters: MembersFilters,
  options: MembersFilterOptions,
): Promise<string[]> {
  const ids = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await buildFilteredMembersQuery(
      supabase,
      filters,
      options,
      FILTERED_HOUSEHOLD_ID_SELECT,
    ).range(offset, offset + EXPORT_BATCH_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    if (rows.length === 0) {
      break;
    }

    for (const row of rows as unknown as { household_id: string }[]) {
      ids.add(row.household_id);
    }

    if (rows.length < EXPORT_BATCH_SIZE) {
      break;
    }

    offset += EXPORT_BATCH_SIZE;
  }

  return Array.from(ids);
}

async function fetchHouseholdsByIds(
  supabase: ReturnType<typeof createAdminClient>,
  householdIds: string[],
): Promise<Household[]> {
  const households: Household[] = [];

  for (let i = 0; i < householdIds.length; i += HOUSEHOLD_ID_CHUNK_SIZE) {
    const chunk = householdIds.slice(i, i + HOUSEHOLD_ID_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .in("id", chunk)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    households.push(...((data ?? []) as Household[]));
  }

  return households.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

async function countMembersInHouseholds(
  supabase: ReturnType<typeof createAdminClient>,
  householdIds: string[],
): Promise<number> {
  let total = 0;

  for (let i = 0; i < householdIds.length; i += HOUSEHOLD_ID_CHUNK_SIZE) {
    const chunk = householdIds.slice(i, i + HOUSEHOLD_ID_CHUNK_SIZE);
    const { count, error } = await supabase
      .from("persons")
      .select("*", { count: "exact", head: true })
      .in("household_id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    total += count ?? 0;
  }

  return total;
}

async function fetchMembersInHouseholds(
  supabase: ReturnType<typeof createAdminClient>,
  householdIds: string[],
): Promise<Person[]> {
  const members: Person[] = [];
  let offset = 0;
  const memberCount = await countMembersInHouseholds(supabase, householdIds);

  while (offset < memberCount) {
    const to = Math.min(offset + EXPORT_BATCH_SIZE - 1, memberCount - 1);
    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .in("household_id", householdIds)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(offset, to);

    if (error) {
      throw new Error(error.message);
    }

    members.push(...((data ?? []) as Person[]));
    offset += EXPORT_BATCH_SIZE;
  }

  return members;
}

async function resolveExportScope(
  supabase: ReturnType<typeof createAdminClient>,
  filters: MembersFilters,
): Promise<{ householdIds: string[]; counts: ExportScopeCounts }> {
  const filterOptions = await prepareMembersFilterOptions(supabase, filters);
  const householdIds = await resolveFilteredHouseholdIds(
    supabase,
    filters,
    filterOptions,
  );

  if (householdIds.length === 0) {
    return {
      householdIds,
      counts: { householdCount: 0, memberCount: 0 },
    };
  }

  const memberCount = await countMembersInHouseholds(supabase, householdIds);

  return {
    householdIds,
    counts: {
      householdCount: householdIds.length,
      memberCount,
    },
  };
}

export async function getExportScopeCounts(
  filters: MembersFilters = {},
): Promise<ActionResult<ExportScopeCounts>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const { counts } = await resolveExportScope(supabase, filters);
    return success(counts);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de calculer le périmètre d'export.";
    return failure(message);
  }
}

export async function getHouseholdsExportDataset(
  filters: MembersFilters = {},
): Promise<ActionResult<HouseholdsExportDataset>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const { householdIds, counts } = await resolveExportScope(supabase, filters);

    if (counts.memberCount === 0) {
      return success({ households: [], members: [] });
    }

    if (counts.memberCount > MAX_MEMBERS_EXPORT) {
      return failure(
        `Export limité à ${MAX_MEMBERS_EXPORT} membres (${counts.memberCount} dans les foyers filtrés). Affinez les filtres.`,
      );
    }

    const [households, members] = await Promise.all([
      fetchHouseholdsByIds(supabase, householdIds),
      fetchMembersInHouseholds(supabase, householdIds),
    ]);

    return success({ households, members });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible d'exporter les familles.";
    return failure(message);
  }
}

export async function loginAdminAction(
  formData: FormData,
): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string" || !token.trim()) {
    redirect("/admin/login?error=" + encodeURIComponent("Jeton requis."));
  }

  if (!verifyAdminToken(token)) {
    redirect(
      "/admin/login?error=" + encodeURIComponent("Jeton admin invalide."),
    );
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function getDashboardMetrics(): Promise<
  ActionResult<DashboardMetrics>
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    const { count: activeHouseholds, error: householdsError } = await supabase
      .from("households")
      .select("*", { count: "exact", head: true })
      .is("unregistered_at", null);

    if (householdsError) {
      return failure(householdsError.message);
    }

    const { data: activePersons, error: personsError } = await supabase
      .from("persons")
      .select("is_child, is_baptized, is_mpandray, is_mpiandry, is_mpamaky_teny, branches, household:households!inner(unregistered_at)")
      .is("household.unregistered_at", null);

    if (personsError) {
      return failure(personsError.message);
    }

    const persons = activePersons ?? [];
    const branchCounts: Record<string, number> = {};

    for (const person of persons) {
      if (Array.isArray(person.branches)) {
        for (const branch of person.branches) {
          const code = resolveBranchCode(branch.branch_code);
          if (code) {
            branchCounts[code] = (branchCounts[code] ?? 0) + 1;
          }
        }
      }
    }

    const metrics: DashboardMetrics = {
      activeHouseholds: activeHouseholds ?? 0,
      totalMembers: persons.length,
      adultCount: persons.filter((p) => !p.is_child).length,
      childCount: persons.filter((p) => p.is_child).length,
      baptizedCount: persons.filter((p) => p.is_baptized).length,
      mpandrayCount: persons.filter((p) => p.is_mpandray).length,
      mpiandryCount: persons.filter((p) => p.is_mpiandry).length,
      mpamakyTenyCount: persons.filter((p) => p.is_mpamaky_teny).length,
      branchCounts,
    };

    return success(metrics);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de charger les métriques.";
    return failure(message);
  }
}

export async function getPaginatedMembers(
  filters: MembersFilters = {},
  page = 1,
  pageSize = 25,
): Promise<ActionResult<PaginatedMembers>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = createAdminClient();
    const filterOptions = await prepareMembersFilterOptions(supabase, filters);

    const { data, count, error } = await buildFilteredMembersQuery(
      supabase,
      filters,
      filterOptions,
      ACTIVE_PERSON_SELECT,
      { count: "exact" },
    ).range(from, to);

    if (error) {
      return failure(error.message);
    }

    return success({
      rows: (data ?? []) as unknown as PersonWithHousehold[],
      total: count ?? 0,
      page: safePage,
      pageSize,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de charger les membres.";
    return failure(message);
  }
}

export async function getHouseholdById(
  id: string,
): Promise<ActionResult<HouseholdDetail>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (householdError) {
      return failure(householdError.message);
    }

    if (!household) {
      return failure("Foyer introuvable.");
    }

    const { data: members, error: membersError } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", id);

    if (membersError) {
      return failure(membersError.message);
    }

    return success({
      household: household as Household,
      members: (members ?? []) as Person[],
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de charger le foyer.";
    return failure(message);
  }
}

export async function getGroupedHouseholdMembers(
  id: string,
): Promise<ActionResult<GroupedHouseholdMembers>> {
  const result = await getHouseholdById(id);
  const data = result.data;
  if (result.error || !data) {
    return failure(result.error ?? "Foyer introuvable.");
  }

  return success(groupPersonsForAdmin(data.members));
}

export async function getHouseholdMembers(
  id: string,
): Promise<
  ActionResult<{
    household: Household;
    grouped: GroupedHouseholdMembers;
    members: Person[];
  }>
> {
  const result = await getHouseholdById(id);
  const data = result.data;
  if (result.error || !data) {
    return failure(result.error ?? "Foyer introuvable.");
  }

  return success({
    household: data.household,
    grouped: groupPersonsForAdmin(data.members),
    members: data.members,
  });
}

function revalidateHouseholdAdminPaths(householdId: string): void {
  revalidatePath("/admin/members");
  revalidatePath(`/admin/households/${householdId}`);
  revalidatePath(`/admin/households/${householdId}/edit`);
}

async function assertHouseholdEditable(
  householdId: string,
): Promise<ActionResult<never> | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .select("unregistered_at")
      .eq("id", householdId)
      .maybeSingle();

    if (error) {
      return failure(error.message);
    }

    if (!data) {
      return failure("Foyer introuvable.");
    }

    if (data.unregistered_at) {
      return failure("Ce foyer est archivé et ne peut pas être modifié.");
    }

    return null;
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de vérifier ce foyer.";
    return failure(message);
  }
}

export async function adminUpdateHousehold(
  householdId: string,
  input: unknown,
): Promise<ActionResult<Household>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.householdSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
  }

  const editableError = await assertHouseholdEditable(householdId);
  if (editableError) return editableError;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .update({
        name: parsed.data.name,
        main_address: parsed.data.main_address,
        landline_phone: optionalTextToNull(parsed.data.landline_phone),
        arrival_date_fjkm: optionalTextToNull(parsed.data.arrival_date_fjkm),
      })
      .eq("id", householdId)
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidateHouseholdAdminPaths(householdId);
    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateHouseholdFailed");
    return failure(message);
  }
}

export async function adminUpsertHouseholdPersons(
  householdId: string,
  input: unknown,
): Promise<ActionResult<Person[]>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors, tValidation } =
    await getServerI18n(locale);

  const parsed = schemas.householdPersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
  }

  if (!householdId) {
    return failure(tErrors("householdIdMissing"));
  }

  const roleError = validateHouseholdRoles(parsed.data);
  if (roleError) {
    return failure(tValidation(roleError));
  }

  const editableError = await assertHouseholdEditable(householdId);
  if (editableError) return editableError;

  const results: Person[] = [];

  try {
    const supabase = createAdminClient();

    for (const entry of flattenHouseholdPersonsForm(parsed.data)) {
      if (entry.kind === "adult") {
        const { id: memberId, ...memberData } = entry.values;
        const personId = memberId?.trim() ? memberId.trim() : undefined;

        if (personId) {
          const { data, error } = await supabase
            .from("persons")
            .update(
              memberFormValuesToPersonInsert(memberData, entry.role),
            )
            .eq("id", personId)
            .select("*")
            .single();

          if (error) {
            return failure(mapSupabaseError(error, tErrors));
          }
          results.push(data);
        } else {
          const { data, error } = await supabase
            .from("persons")
            .insert({
              household_id: householdId,
              ...memberFormValuesToPersonInsert(memberData, entry.role),
            })
            .select("*")
            .single();

          if (error) {
            return failure(
              mapSupabaseError(error, tErrors) ??
                tErrors("addMemberGenericFailed"),
            );
          }
          results.push(data);
        }
      } else {
        const { id: childId, ...childData } = entry.values;
        const personId = childId?.trim() ? childId.trim() : undefined;

        if (personId) {
          const updateResult = await updateChild(personId, {
            locale,
            ...childData,
          });
          if (updateResult.error || !updateResult.data) {
            return failure(
              updateResult.error ?? tErrors("updateChildFailed"),
            );
          }
          results.push(updateResult.data);
        } else {
          const createResult = await createChild({
            locale,
            household_id: householdId,
            ...childData,
          });
          if (createResult.error || !createResult.data) {
            return failure(
              createResult.error ?? tErrors("addChildGenericFailed"),
            );
          }
          results.push(createResult.data);
        }
      }
    }

    const keptIdSet = new Set(results.map((person) => person.id));
    const { data: existingMembers, error: fetchMembersError } = await supabase
      .from("persons")
      .select("id")
      .eq("household_id", householdId);

    if (fetchMembersError) {
      return failure(mapSupabaseError(fetchMembersError, tErrors));
    }

    const idsToDelete = (existingMembers ?? [])
      .map((row) => row.id)
      .filter((id) => !keptIdSet.has(id));

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("persons")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        return failure(mapSupabaseError(deleteError, tErrors));
      }
    }

    revalidateHouseholdAdminPaths(householdId);
    revalidatePath("/");
    return success(results);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateMemberFailed");
    return failure(message);
  }
}

export async function unregisterHouseholdAction(
  householdId: string,
): Promise<ActionResult<null>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    const { data: household, error: fetchError } = await supabase
      .from("households")
      .select("unregistered_at")
      .eq("id", householdId)
      .maybeSingle();

    if (fetchError) {
      return failure(fetchError.message);
    }

    if (!household) {
      return failure("Foyer introuvable.");
    }

    if (household.unregistered_at) {
      return failure("Ce foyer est déjà désinscrit.");
    }

    const { error: updateError } = await supabase
      .from("households")
      .update({ unregistered_at: new Date().toISOString() })
      .eq("id", householdId);

    if (updateError) {
      return failure(updateError.message);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/members");
    revalidatePath(`/admin/households/${householdId}`);

    return success(null);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de désinscrire ce foyer.";
    return failure(message);
  }
}

export async function checkAdminSession(): Promise<boolean> {
  return getAdminSession();
}
