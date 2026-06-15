"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  failure,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { assertAdminSession } from "@/lib/admin/auth";
import {
  buildDuplicateGroups,
  clusterDuplicateBuckets,
} from "@/lib/deduplication/cluster";
import {
  mergeDraftToPatch,
  type MergeProfileDraft,
} from "@/lib/deduplication/merge-draft";
import type {
  DuplicateBucket,
  DuplicateGroup,
  DuplicateMatchType,
  DuplicatePersonSummary,
} from "@/lib/deduplication/types";
import {
  normalizeEmails,
  normalizePhones,
} from "@/lib/contacts/person-contacts";
import { resolveBranchCode } from "@/lib/constants/branches";
import { HOUSEHOLD_ROLES } from "@/lib/constants/person-roles";
import { createAdminClient } from "@/lib/supabase/supabase";
import type { PersonBranchAssignment } from "@/types/database";

async function requireAdmin(): Promise<ActionResult<never> | null> {
  try {
    await assertAdminSession();
    return null;
  } catch {
    return failure("Session admin invalide ou expirée.");
  }
}

function parseMatchType(value: string): DuplicateMatchType | null {
  if (value === "email" || value === "name" || value === "phone") {
    return value;
  }
  return null;
}

function mapBucketRow(row: {
  match_type: string;
  match_key: string;
  person_ids: string[];
}): DuplicateBucket | null {
  const matchType = parseMatchType(row.match_type);
  if (!matchType || row.person_ids.length < 2) {
    return null;
  }
  return {
    matchType,
    matchKey: row.match_key,
    personIds: row.person_ids,
  };
}

type PersonRow = {
  id: string;
  first_name: string;
  last_name: string;
  emails: string[];
  phones: string[];
  role: string;
  age: number | null;
  household_id: string;
  branches: PersonBranchAssignment[];
  is_baptized: boolean;
  is_mpandray: boolean;
  is_mpiandry: boolean;
  is_mpamaky_teny: boolean;
  is_sefala: boolean;
  created_at: string;
  updated_at: string;
  household: { id: string; name: string } | null;
};

async function fetchAssignmentCounts(
  supabase: ReturnType<typeof createAdminClient>,
  personIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (const id of personIds) {
    counts.set(id, 0);
  }

  if (personIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from("service_assignments")
    .select("person_id")
    .in("person_id", personIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    counts.set(row.person_id, (counts.get(row.person_id) ?? 0) + 1);
  }

  return counts;
}

function toDuplicatePersonSummary(
  person: PersonRow,
  assignmentCount: number,
): DuplicatePersonSummary {
  return {
    id: person.id,
    firstName: person.first_name,
    lastName: person.last_name,
    emails: person.emails ?? [],
    phones: person.phones ?? [],
    role: person.role,
    age: person.age,
    householdId: person.household_id,
    householdName: person.household?.name ?? "—",
    branches: person.branches ?? [],
    isBaptized: person.is_baptized,
    isMpandray: person.is_mpandray,
    isMpiandry: person.is_mpiandry,
    isMpamakyTeny: person.is_mpamaky_teny,
    isSefala: person.is_sefala,
    assignmentCount,
    createdAt: person.created_at,
    updatedAt: person.updated_at,
  };
}

export async function getPotentialDuplicates(): Promise<
  ActionResult<DuplicateGroup[]>
> {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  try {
    const supabase = createAdminClient();
    const { data: bucketRows, error: bucketError } = await supabase.rpc(
      "find_person_duplicate_buckets",
    );

    if (bucketError) {
      return failure(bucketError.message);
    }

    const buckets = (bucketRows ?? [])
      .map(mapBucketRow)
      .filter((bucket): bucket is DuplicateBucket => bucket != null);

    if (buckets.length === 0) {
      return success([]);
    }

    const clusters = clusterDuplicateBuckets(buckets);
    const personIds = Array.from(
      new Set(clusters.flatMap((c) => c.personIds)),
    );

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select(
        "id, first_name, last_name, emails, phones, role, age, household_id, branches, is_baptized, is_mpandray, is_mpiandry, is_mpamaky_teny, is_sefala, created_at, updated_at, household:households(id, name)",
      )
      .in("id", personIds);

    if (personsError) {
      return failure(personsError.message);
    }

    const assignmentCounts = await fetchAssignmentCounts(supabase, personIds);
    const personsById = new Map<string, DuplicatePersonSummary>();

    for (const person of (persons ?? []) as PersonRow[]) {
      personsById.set(
        person.id,
        toDuplicatePersonSummary(
          person,
          assignmentCounts.get(person.id) ?? 0,
        ),
      );
    }

    return success(buildDuplicateGroups(clusters, personsById));
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Erreur inattendue.",
    );
  }
}

const mergeProfileDraftSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis."),
  lastName: z.string().trim().min(1, "Le nom est requis."),
  emails: z.array(z.string()).transform((values) => normalizeEmails(values)),
  phones: z.array(z.string()).transform((values) => normalizePhones(values)),
  role: z.enum(HOUSEHOLD_ROLES),
  age: z.string().trim(),
  branches: z
    .array(
      z.object({
        branch_code: z.string().min(1),
        role: z.string().nullable(),
      }),
    )
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const resolved = resolveBranchCode(item.branch_code);
        if (!resolved) {
          ctx.addIssue({
            code: "custom",
            message: "Branche invalide.",
            path: [index, "branch_code"],
          });
          return;
        }
        if (seen.has(resolved)) {
          ctx.addIssue({
            code: "custom",
            message: "Branche en double.",
            path: [index, "branch_code"],
          });
        }
        seen.add(resolved);
      });
    })
    .transform((items) =>
      items.map((item) => ({
        branch_code: resolveBranchCode(item.branch_code)!,
        role: item.role?.trim() || null,
      })),
    ),
  isBaptized: z.boolean(),
  isMpandray: z.boolean(),
  isMpiandry: z.boolean(),
  isSefala: z.boolean(),
  isMpamakyTeny: z.boolean(),
});

const mergePersonsSchema = z
  .object({
    masterPersonId: z.string().uuid(),
    duplicatePersonId: z.string().uuid(),
    patch: mergeProfileDraftSchema,
  })
  .refine((data) => data.masterPersonId !== data.duplicatePersonId, {
    message: "Le profil maître et le doublon doivent être distincts.",
  });

export async function mergePersons(input: {
  masterPersonId: string;
  duplicatePersonId: string;
  patch: MergeProfileDraft;
}): Promise<ActionResult<{ merged: true }>> {
  const authError = await requireAdmin();
  if (authError) {
    return authError;
  }

  const parsed = mergePersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.rpc("merge_persons", {
      p_master: parsed.data.masterPersonId,
      p_duplicate: parsed.data.duplicatePersonId,
      p_patch: mergeDraftToPatch(parsed.data.patch),
    });

    if (error) {
      return failure(error.message);
    }

    revalidatePath("/admin/doublons");
    revalidatePath("/admin/members");
    revalidatePath("/admin/cultes");

    return success({ merged: true });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Erreur inattendue.",
    );
  }
}
