"use server";

import { revalidatePath } from "next/cache";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import {
  childFormValuesToPersonInsert,
  memberFormValuesToPersonInsert,
} from "@/lib/registration/mappers";
import { assertHouseholdIsActive } from "@/lib/actions/household-guard";
import { createAdminClient } from "@/lib/supabase/supabase";
import {
  adultInputSchema,
  childInputSchema,
  childSchema,
  householdPersonsSchema,
  memberSchema,
  type ChildFormValues,
  type HouseholdPersonsFormValues,
  type MemberFormValues,
} from "@/lib/validations/registration";
import type { Person, PersonInsert } from "@/types/database";

function normalizeAdult(
  member: MemberFormValues,
): Omit<PersonInsert, "household_id"> {
  return memberFormValuesToPersonInsert(member);
}

function normalizeChild(
  child: ChildFormValues,
): Omit<PersonInsert, "household_id"> {
  return childFormValuesToPersonInsert(child);
}

export async function createAdult(
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = adultInputSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  const { household_id, ...member } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .insert({
        household_id,
        ...normalizeAdult(member),
      })
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible d'ajouter le membre.";
    return failure(message);
  }
}

export async function createChild(
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = childInputSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  const { household_id, ...child } = parsed.data;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .insert({
        household_id,
        ...normalizeChild(child),
      })
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible d'ajouter l'enfant.";
    return failure(message);
  }
}

/** @deprecated Utiliser saveHouseholdPersons */
export async function createPerson(
  input: unknown,
): Promise<ActionResult<Person>> {
  return createAdult(input);
}

/** @deprecated Utiliser saveHouseholdPersons */
export async function createPersons(
  householdId: string,
  members: unknown,
): Promise<ActionResult<Person[]>> {
  return saveHouseholdPersons(householdId, { members, children: [] });
}

export async function saveHouseholdPersons(
  householdId: string,
  input: unknown,
): Promise<ActionResult<Person[]>> {
  const parsed = householdPersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  if (!householdId) {
    return failure("Identifiant de foyer manquant.");
  }

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(supabase, householdId);
    if (!activeCheck.ok) {
      return failure(activeCheck.message);
    }

    const rows = [
      ...parsed.data.members.map((member) => ({
        household_id: householdId,
        ...normalizeAdult(member),
      })),
      ...parsed.data.children.map((child) => ({
        household_id: householdId,
        ...normalizeChild(child),
      })),
    ];

    const { data, error } = await supabase
      .from("persons")
      .insert(rows)
      .select("*");

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible d'enregistrer les personnes du foyer.";
    return failure(message);
  }
}

export async function listPersonsByHousehold(
  householdId: string,
): Promise<ActionResult<Person[]>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", householdId)
      .order("last_name");

    if (error) {
      return failure(mapSupabaseError(error));
    }

    return success(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de récupérer les personnes du foyer.";
    return failure(message);
  }
}

export async function updateAdult(
  id: string,
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .update(normalizeAdult(parsed.data))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de mettre à jour le membre.";
    return failure(message);
  }
}

export async function updateChild(
  id: string,
  input: unknown,
): Promise<ActionResult<Person>> {
  const parsed = childSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .update(normalizeChild(parsed.data))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de mettre à jour l'enfant.";
    return failure(message);
  }
}

/** @deprecated Utiliser updateAdult */
export async function updatePerson(
  id: string,
  input: unknown,
): Promise<ActionResult<Person>> {
  return updateAdult(id, input);
}

export async function upsertHouseholdPersons(
  householdId: string,
  input: unknown,
): Promise<ActionResult<Person[]>> {
  const parsed = householdPersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  if (!householdId) {
    return failure("Identifiant de foyer manquant.");
  }

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(supabase, householdId);
    if (!activeCheck.ok) {
      return failure(activeCheck.message);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de vérifier le foyer.";
    return failure(message);
  }

  const results: Person[] = [];

  for (const member of parsed.data.members) {
    const { id, ...memberData } = member;
    const personId = id?.trim() ? id.trim() : undefined;

    if (personId) {
      const updateResult = await updateAdult(personId, memberData);
      if (updateResult.error || !updateResult.data) {
        return failure(
          updateResult.error ?? "Impossible de mettre à jour un membre.",
        );
      }
      results.push(updateResult.data);
    } else {
      const createResult = await createAdult({
        household_id: householdId,
        ...memberData,
      });
      if (createResult.error || !createResult.data) {
        return failure(
          createResult.error ?? "Impossible d'ajouter un membre.",
        );
      }
      results.push(createResult.data);
    }
  }

  for (const child of parsed.data.children) {
    const { id, ...childData } = child;
    const personId = id?.trim() ? id.trim() : undefined;

    if (personId) {
      const updateResult = await updateChild(personId, childData);
      if (updateResult.error || !updateResult.data) {
        return failure(
          updateResult.error ?? "Impossible de mettre à jour un enfant.",
        );
      }
      results.push(updateResult.data);
    } else {
      const createResult = await createChild({
        household_id: householdId,
        ...childData,
      });
      if (createResult.error || !createResult.data) {
        return failure(
          createResult.error ?? "Impossible d'ajouter un enfant.",
        );
      }
      results.push(createResult.data);
    }
  }

  revalidatePath("/");
  return success(results);
}

/** @deprecated Utiliser upsertHouseholdPersons */
export async function upsertHouseholdMembers(
  householdId: string,
  members: unknown,
): Promise<ActionResult<Person[]>> {
  const parsedMembers = memberSchema.array().min(1).safeParse(members);
  if (!parsedMembers.success) {
    return failure(
      parsedMembers.error.issues[0]?.message ??
        "Ajoutez au moins un membre valide.",
    );
  }

  return upsertHouseholdPersons(householdId, {
    members: parsedMembers.data,
    children: [],
  });
}

export async function deletePerson(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("persons").delete().eq("id", id);

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de supprimer la personne.";
    return failure(message);
  }
}

export type { HouseholdPersonsFormValues };
