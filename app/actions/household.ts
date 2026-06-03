"use server";

import { revalidatePath } from "next/cache";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { assertHouseholdIsActive } from "@/lib/actions/household-guard";
import { createAdminClient } from "@/lib/supabase/supabase";
import { householdSchema } from "@/lib/validations/registration";
import type { Household, HouseholdInsert } from "@/types/database";

export async function createHousehold(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = householdSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .insert({
        name: parsed.data.name,
        main_address: parsed.data.main_address,
      } satisfies HouseholdInsert)
      .select("id")
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success({ id: data.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de créer le foyer.";
    return failure(message);
  }
}

export async function getHousehold(
  id: string,
): Promise<ActionResult<Household>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return failure(mapSupabaseError(error));
    }

    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de récupérer le foyer.";
    return failure(message);
  }
}

export async function updateHousehold(
  id: string,
  input: unknown,
): Promise<ActionResult<Household>> {
  const parsed = householdSchema.safeParse(input);
  if (!parsed.success) {
    return failure(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(supabase, id);
    if (!activeCheck.ok) {
      return failure(activeCheck.message);
    }

    const { data, error } = await supabase
      .from("households")
      .update({
        name: parsed.data.name,
        main_address: parsed.data.main_address,
      })
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
      err instanceof Error ? err.message : "Impossible de mettre à jour le foyer.";
    return failure(message);
  }
}

/** Suppression définitive — réservé à un usage admin ; préférer unregisterHousehold. */
export async function deleteHousehold(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("households").delete().eq("id", id);

    if (error) {
      return failure(mapSupabaseError(error));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Impossible de supprimer le foyer.";
    return failure(message);
  }
}
