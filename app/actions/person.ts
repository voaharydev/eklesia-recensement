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
import {
  childFormValuesToPersonInsert,
  memberFormValuesToPersonInsert,
} from "@/lib/registration/mappers";
import { createAdminClient } from "@/lib/supabase/supabase";
import type {
  ChildFormValues,
  HouseholdPersonsFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type { Person, PersonInsert } from "@/types/database";

const localePayloadSchema = z.object({
  locale: localeSchema,
});

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
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.adultInputSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
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
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("addMemberFailed");
    return failure(message);
  }
}

export async function createChild(
  input: unknown,
): Promise<ActionResult<Person>> {
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.childInputSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
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
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("addChildFailed");
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
  locale: string,
): Promise<ActionResult<Person[]>> {
  return saveHouseholdPersons(householdId, { members, children: [], locale });
}

export async function saveHouseholdPersons(
  householdId: string,
  input: unknown,
): Promise<ActionResult<Person[]>> {
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.householdPersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
  }

  if (!householdId) {
    return failure(tErrors("householdIdMissing"));
  }

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(
      supabase,
      householdId,
      tErrors,
    );
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
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("savePersonsFailed");
    return failure(message);
  }
}

export async function listPersonsByHousehold(
  householdId: string,
  localeInput: string,
): Promise<ActionResult<Person[]>> {
  const { tErrors } = await getServerI18n(localeInput);

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .select("*")
      .eq("household_id", householdId)
      .order("last_name");

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("savePersonsFailed");
    return failure(message);
  }
}

export async function updateAdult(
  id: string,
  input: unknown,
): Promise<ActionResult<Person>> {
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.memberSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
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
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateMemberFailed");
    return failure(message);
  }
}

export async function updateChild(
  id: string,
  input: unknown,
): Promise<ActionResult<Person>> {
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.childSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
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
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateChildFailed");
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
  const localeField = localePayloadSchema.safeParse(input);
  if (!localeField.success) {
    return failure("Invalid request");
  }

  const { locale } = localeField.data;
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);

  const parsed = schemas.householdPersonsSchema.safeParse(input);
  if (!parsed.success) {
    return failure(formatZodError(parsed.error) ?? tErrors("invalidData"));
  }

  if (!householdId) {
    return failure(tErrors("householdIdMissing"));
  }

  try {
    const supabase = createAdminClient();
    const activeCheck = await assertHouseholdIsActive(
      supabase,
      householdId,
      tErrors,
    );
    if (!activeCheck.ok) {
      return failure(activeCheck.message);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("verifyHouseholdFailed");
    return failure(message);
  }

  const results: Person[] = [];

  for (const member of parsed.data.members) {
    const { id: memberId, ...memberData } = member;
    const personId = memberId?.trim() ? memberId.trim() : undefined;

    if (personId) {
      const updateResult = await updateAdult(personId, {
        locale,
        ...memberData,
      });
      if (updateResult.error || !updateResult.data) {
        return failure(
          updateResult.error ?? tErrors("updateMemberFailed"),
        );
      }
      results.push(updateResult.data);
    } else {
      const createResult = await createAdult({
        locale,
        household_id: householdId,
        ...memberData,
      });
      if (createResult.error || !createResult.data) {
        return failure(
          createResult.error ?? tErrors("addMemberGenericFailed"),
        );
      }
      results.push(createResult.data);
    }
  }

  for (const child of parsed.data.children) {
    const { id: childId, ...childData } = child;
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

  revalidatePath("/");
  return success(results);
}

/** @deprecated Utiliser upsertHouseholdPersons */
export async function upsertHouseholdMembers(
  householdId: string,
  members: unknown,
  locale: string,
): Promise<ActionResult<Person[]>> {
  const { schemas, formatZodError, tErrors } = await getServerI18n(locale);
  const parsedMembers = schemas.memberSchema.array().min(1).safeParse(members);
  if (!parsedMembers.success) {
    return failure(
      formatZodError(parsedMembers.error) ?? tErrors("invalidMembers"),
    );
  }

  return upsertHouseholdPersons(householdId, {
    locale,
    members: parsedMembers.data,
    children: [],
  });
}

export async function deletePerson(
  id: string,
  localeInput: string,
): Promise<ActionResult<null>> {
  const { tErrors } = await getServerI18n(localeInput);

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("persons").delete().eq("id", id);

    if (error) {
      return failure(mapSupabaseError(error, tErrors));
    }

    revalidatePath("/");
    return success(null);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("deletePersonFailed");
    return failure(message);
  }
}

export type { HouseholdPersonsFormValues };
