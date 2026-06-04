"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { getServerI18n } from "@/lib/i18n/server";
import { localeSchema } from "@/lib/i18n/locale";
import {
  normalizeEmailForLookup,
  splitPersonsForForm,
} from "@/lib/registration/mappers";
import { createAdminClient } from "@/lib/supabase/supabase";
import type {
  ChildFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type { Household, Person } from "@/types/database";

export type RegistrationLookupResult =
  | {
      found: true;
      household: Household;
      head: MemberFormValues;
      spouse: MemberFormValues | null;
      otherAdults: MemberFormValues[];
      children: ChildFormValues[];
    }
  | { found: false };

export type LookupByEmailResult = ActionResult<RegistrationLookupResult>;

function personEmailMatches(
  email: string | null,
  normalizedEmail: string,
): boolean {
  return (
    email != null && email.trim().toLowerCase() === normalizedEmail
  );
}

function findPersonByNormalizedEmail(
  persons: Person[],
  normalizedEmail: string,
): Person | undefined {
  return persons.find((p) => personEmailMatches(p.email, normalizedEmail));
}

const lookupByEmailInputSchema = z.object({
  locale: localeSchema,
  email: z.string(),
});

export async function lookupByEmail(
  input: unknown,
): Promise<LookupByEmailResult> {
  const payload = lookupByEmailInputSchema.safeParse(input);
  if (!payload.success) {
    return failure("Invalid request");
  }

  const { locale, email } = payload.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.emailLookupSchema.safeParse({ email });
  if (!parsed.success) {
    return failure(formatZodError(parsed.error));
  }

  const normalizedEmail = normalizeEmailForLookup(parsed.data.email);

  try {
    const supabase = createAdminClient();

    const { data: candidates, error: lookupError } = await supabase
      .from("persons")
      .select("*")
      .ilike("email", normalizedEmail)
      .limit(20);

    if (lookupError) {
      return failure(mapSupabaseError(lookupError, tErrors));
    }

    const matchedPerson = findPersonByNormalizedEmail(
      candidates ?? [],
      normalizedEmail,
    );

    if (!matchedPerson) {
      return success({ found: false });
    }

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("*")
      .eq("id", matchedPerson.household_id)
      .single();

    if (householdError) {
      return failure(mapSupabaseError(householdError, tErrors));
    }

    if (household.unregistered_at) {
      return success({ found: false });
    }

    const { data: members, error: membersError } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", household.id)
      .order("last_name");

    if (membersError) {
      return failure(mapSupabaseError(membersError, tErrors));
    }

    const { head, spouse, otherAdults, children } = splitPersonsForForm(
      members ?? [],
    );

    return success({
      found: true,
      household,
      head,
      spouse,
      otherAdults,
      children,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("lookupFailed");
    return failure(message);
  }
}

const unregisterHouseholdInputSchema = z.object({
  locale: localeSchema,
  householdId: z.string().uuid(),
  email: z.string(),
});

export async function unregisterHousehold(
  input: unknown,
): Promise<ActionResult<null>> {
  const payload = unregisterHouseholdInputSchema.safeParse(input);
  if (!payload.success) {
    return failure("Invalid request");
  }

  const { locale, householdId, email } = payload.data;
  const { schemas, formatZodError, tValidation, tErrors } =
    await getServerI18n(locale);

  const parsed = z
    .object({
      householdId: z.string().uuid(tValidation("householdIdInvalid")),
      email: schemas.emailLookupSchema.shape.email,
    })
    .safeParse({ householdId, email });

  if (!parsed.success) {
    return failure(formatZodError(parsed.error));
  }

  const normalizedEmail = normalizeEmailForLookup(parsed.data.email);

  try {
    const supabase = createAdminClient();

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, unregistered_at")
      .eq("id", householdId)
      .single();

    if (householdError || !household) {
      return failure(tErrors("householdNotFound"));
    }

    if (household.unregistered_at) {
      return failure(tErrors("householdAlreadyUnregistered"));
    }

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id, email")
      .eq("household_id", householdId);

    if (personsError) {
      return failure(mapSupabaseError(personsError, tErrors));
    }

    const emailMatchesHousehold = (persons ?? []).some((p) =>
      personEmailMatches(p.email, normalizedEmail),
    );

    if (!emailMatchesHousehold) {
      return failure(tErrors("emailNotInHousehold"));
    }

    const { error: updateError } = await supabase
      .from("households")
      .update({ unregistered_at: new Date().toISOString() })
      .eq("id", householdId);

    if (updateError) {
      return failure(mapSupabaseError(updateError, tErrors));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("unregisterFailed");
    return failure(message);
  }
}
