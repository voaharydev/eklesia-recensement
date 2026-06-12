"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
  GroupedHouseholdMembers,
  HouseholdDetail,
  MembersFilters,
  PaginatedMembers,
  PersonWithHousehold,
} from "@/lib/admin/types";
import { resolveUpdatedFilter } from "@/lib/admin/updated-filter";
import {
  failure,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { resolveBranchCode } from "@/lib/constants/branches";
import { createAdminClient } from "@/lib/supabase/supabase";
import type { Household, Person } from "@/types/database";

const ACTIVE_PERSON_SELECT =
  "*, household:households!inner(id, name, unregistered_at, updated_at, created_at)";

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

    let searchHouseholdIds: string[] | undefined;
    const searchTerm = filters.search?.trim();
    if (searchTerm) {
      searchHouseholdIds = await resolveSearchHouseholdIds(
        supabase,
        searchTerm,
        filters.status,
      );
    }

    let neverUpdatedHouseholdIds: string[] | undefined;
    const updatedFilter = resolveUpdatedFilter(filters);
    if (updatedFilter?.mode === "never") {
      neverUpdatedHouseholdIds = await resolveNeverUpdatedHouseholdIds(
        supabase,
        filters.status,
      );
    }

    let query = supabase
      .from("persons")
      .select(ACTIVE_PERSON_SELECT, { count: "exact" });

    query = applyMembersFilters(query, filters, {
      searchHouseholdIds,
      neverUpdatedHouseholdIds,
    });

    const { data, count, error } = await query
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true })
      .range(from, to);

    if (error) {
      return failure(error.message);
    }

    return success({
      rows: (data ?? []) as PersonWithHousehold[],
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
