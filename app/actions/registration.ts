"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import {
  normalizeEmailForLookup,
  splitPersonsForForm,
} from "@/lib/registration/mappers";
import { createAdminClient } from "@/lib/supabase/supabase";
import { formatZodError } from "@/lib/validations/format-zod-error";
import { emailLookupSchema } from "@/lib/validations/registration";
import type {
  ChildFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type { Household, Person } from "@/types/database";

export type RegistrationLookupResult =
  | {
      found: true;
      household: Household;
      members: MemberFormValues[];
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

export async function lookupByEmail(
  input: unknown,
): Promise<LookupByEmailResult> {
  const parsed = emailLookupSchema.safeParse(input);
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
      return failure(mapSupabaseError(lookupError));
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
      return failure(mapSupabaseError(householdError));
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
      return failure(mapSupabaseError(membersError));
    }

    const { members: adultMembers, children } = splitPersonsForForm(
      members ?? [],
    );

    return success({
      found: true,
      household,
      members: adultMembers,
      children,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de rechercher ce courriel.";
    return failure(message);
  }
}

const unregisterHouseholdInputSchema = z.object({
  householdId: z.string().uuid("Identifiant de foyer invalide."),
  email: emailLookupSchema.shape.email,
});

export async function unregisterHousehold(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = unregisterHouseholdInputSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error));
  }

  const { householdId, email } = parsed.data;
  const normalizedEmail = normalizeEmailForLookup(email);

  try {
    const supabase = createAdminClient();

    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("id, unregistered_at")
      .eq("id", householdId)
      .single();

    if (householdError || !household) {
      return failure("Foyer introuvable.");
    }

    if (household.unregistered_at) {
      return failure("Ce foyer est déjà désinscrit.");
    }

    const { data: persons, error: personsError } = await supabase
      .from("persons")
      .select("id, email")
      .eq("household_id", householdId);

    if (personsError) {
      return failure(mapSupabaseError(personsError));
    }

    const emailMatchesHousehold = (persons ?? []).some((p) =>
      personEmailMatches(p.email, normalizedEmail),
    );

    if (!emailMatchesHousehold) {
      return failure(
        "Ce courriel ne correspond pas à un membre de ce foyer.",
      );
    }

    const { error: updateError } = await supabase
      .from("households")
      .update({ unregistered_at: new Date().toISOString() })
      .eq("id", householdId);

    if (updateError) {
      return failure(mapSupabaseError(updateError));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de désinscrire ce foyer.";
    return failure(message);
  }
}
