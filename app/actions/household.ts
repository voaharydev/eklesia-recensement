"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { assertHouseholdIsActive } from "@/lib/actions/household-guard";
import { getServerI18n } from "@/lib/i18n/server";
import { localeSchema } from "@/lib/i18n/locale";
import { optionalTextToNull } from "@/lib/registration/spouse";
import { createAdminClient } from "@/lib/supabase/supabase";
import type { Household, HouseholdInsert } from "@/types/database";

const localePayloadSchema = z.object({
  locale: localeSchema,
});

export async function createHousehold(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.householdSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      formatZodError(parsed.error) ?? tErrors("invalidData"),
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .insert({
        name: parsed.data.name,
        main_address: parsed.data.main_address,
        landline_phone: optionalTextToNull(parsed.data.landline_phone),
        arrival_date_fjkm: optionalTextToNull(parsed.data.arrival_date_fjkm),
      } satisfies HouseholdInsert)
      .select("id")
      .single();

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success({ id: data.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("createHouseholdFailed");
    return failure(message);
  }
}

export async function getHousehold(
  id: string,
  localeInput: string,
): Promise<ActionResult<Household>> {
  const { tErrors } = await getServerI18n(localeInput);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("getHouseholdFailed");
    return failure(message);
  }
}

export async function updateHousehold(
  id: string,
  input: unknown,
): Promise<ActionResult<Household>> {
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

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(supabase, id, tErrors);
    if (!activeCheck.ok) {
      return failure(activeCheck.message);
    }

    const { data, error } = await supabase
      .from("households")
      .update({
        name: parsed.data.name,
        main_address: parsed.data.main_address,
        landline_phone: optionalTextToNull(parsed.data.landline_phone),
        arrival_date_fjkm: optionalTextToNull(parsed.data.arrival_date_fjkm),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateHouseholdFailed");
    return failure(message);
  }
}

/** Suppression définitive — réservé à un usage admin ; préférer unregisterHousehold. */
export async function deleteHousehold(
  id: string,
  localeInput: string,
): Promise<ActionResult<null>> {
  const { tErrors } = await getServerI18n(localeInput);

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("households").delete().eq("id", id);

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("deleteHouseholdFailed");
    return failure(message);
  }
}
