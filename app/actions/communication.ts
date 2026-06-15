"use server";

import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { assertAdminSession } from "@/lib/admin/auth";
import {
  applyCommunicationPostFilters,
  mapToTargetedMembers,
  type CommunicationPersonRow,
} from "@/lib/communication/filter-targeted-members";
import { SPIRITUAL_FILTER_OPTIONS } from "@/lib/communication/parse-communication-filters";
import { BRANCH_ROLE_CANONICAL_LABELS } from "@/lib/constants/branch-roles";
import { BRANCH_CODES } from "@/lib/constants/branches";
import { createAdminClient } from "@/lib/supabase/supabase";
import type {
  CommunicationFilters,
  HouseholdSearchResult,
  SpiritualFilter,
  TargetedMember,
} from "@/types/communication";

const COMMUNICATION_PERSON_SELECT =
  "id, first_name, last_name, emails, phones, age, branches, household:households!inner(name, unregistered_at)";

const communicationFiltersSchema = z.object({
  ageMin: z.number().int().min(0).optional(),
  ageMax: z.number().int().min(0).optional(),
  branch: z.enum(BRANCH_CODES).optional(),
  branchRole: z
    .enum(
      Object.keys(BRANCH_ROLE_CANONICAL_LABELS) as [
        keyof typeof BRANCH_ROLE_CANONICAL_LABELS,
        ...Array<keyof typeof BRANCH_ROLE_CANONICAL_LABELS>,
      ],
    )
    .optional(),
  spiritual: z.enum(SPIRITUAL_FILTER_OPTIONS).optional(),
  householdId: z.string().uuid().optional(),
  channel: z.enum(["email", "sms"]).optional().default("email"),
});

const searchHouseholdsSchema = z.object({
  query: z.string().trim().min(2).max(120),
});

async function requireAdmin(): Promise<ActionResult<never> | null> {
  try {
    await assertAdminSession();
    return null;
  } catch {
    return failure("Session admin invalide ou expirée.");
  }
}

function applySpiritualFilter(
  query: ReturnType<ReturnType<typeof createAdminClient>["from"]>,
  spiritual: SpiritualFilter,
) {
  switch (spiritual) {
    case "mpandray":
      return query.eq("is_mpandray", true);
    case "mpiandry":
      return query.eq("is_mpiandry", true);
    case "sefala":
      return query.eq("is_sefala", true);
    case "baptized":
      return query.eq("is_baptized", true);
    case "mpamaky_teny":
      return query.eq("is_mpamaky_teny", true);
    default:
      return query;
  }
}

export async function getTargetedMembers(
  input?: unknown,
): Promise<ActionResult<TargetedMember[]>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = communicationFiltersSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return failure("Filtres de communication invalides.");
  }

  const filters: CommunicationFilters = parsed.data;
  const supabase = createAdminClient();

  let query = supabase
    .from("persons")
    .select(COMMUNICATION_PERSON_SELECT)
    .is("household.unregistered_at", null);

  if (filters.householdId) {
    query = query.eq("household_id", filters.householdId);
  }

  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    query = query.not("age", "is", null);
    if (filters.ageMin !== undefined) {
      query = query.gte("age", filters.ageMin);
    }
    if (filters.ageMax !== undefined) {
      query = query.lte("age", filters.ageMax);
    }
  }

  if (filters.branch) {
    query = query.contains(
      "branches",
      JSON.stringify([{ branch_code: filters.branch }]),
    );
  }

  if (filters.spiritual) {
    query = applySpiritualFilter(query, filters.spiritual);
  }

  const { data, error } = await query;

  if (error) {
    return failure(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  const filtered = applyCommunicationPostFilters(
    (data ?? []) as CommunicationPersonRow[],
    {
      branchRole: filters.branchRole,
      channel: filters.channel ?? "email",
    },
  );

  return success(mapToTargetedMembers(filtered));
}

export async function searchHouseholds(
  input: unknown,
): Promise<ActionResult<HouseholdSearchResult[]>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = searchHouseholdsSchema.safeParse(input);
  if (!parsed.success) {
    return success([]);
  }

  const supabase = createAdminClient();
  const pattern = `%${parsed.data.query.replace(/[%_\\]/g, (char) => `\\${char}`)}%`;

  const { data, error } = await supabase
    .from("households")
    .select("id, name")
    .is("unregistered_at", null)
    .ilike("name", pattern)
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    return failure(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  return success(data ?? []);
}
