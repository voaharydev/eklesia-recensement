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
import type { FormHouseholdRole } from "@/lib/constants/person-roles";
import { validateHouseholdRoles } from "@/lib/registration/household-role";
import {
  childFormValuesToPersonInsert,
  flattenHouseholdPersonsForm,
  memberFormValuesToPersonInsert,
} from "@/lib/registration/mappers";
import { createAdminClient } from "@/lib/supabase/supabase";
import type {
  HouseholdPersonsFormValues,
  MemberFormValues,
} from "@/lib/validations/registration";
import type { Person, PersonInsert } from "@/types/database";

const localePayloadSchema = z.object({
  locale: localeSchema,
});

function personInsertFromFlattenedEntry(
  householdId: string,
  entry: ReturnType<typeof flattenHouseholdPersonsForm>[number],
): PersonInsert {
  if (entry.kind === "adult") {
    return {
      household_id: householdId,
      ...memberFormValuesToPersonInsert(entry.values, entry.role),
    };
  }
  return {
    household_id: householdId,
    ...childFormValuesToPersonInsert(entry.values),
  };
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
        ...memberFormValuesToPersonInsert(member, "chef_de_famille"),
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
        ...childFormValuesToPersonInsert(child),
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
  const parsedMembers = Array.isArray(members) ? members : [];
  const first = parsedMembers[0] as MemberFormValues | undefined;
  if (!first) {
    return failure("Invalid request");
  }
  return saveHouseholdPersons(householdId, {
    locale,
    head: first,
    spouse: {
      civility: "",
      first_name: "",
      last_name: "",
      age: "",
      email: "",
      phone: "",
      preferred_language: "fr",
      is_visible_in_directory: true,
      is_baptized: false,
      baptized_since: "",
      is_mpiandry: false,
      mpiandry_since: "",
      is_mpandray: false,
      mpandray_since: "",
      branches: [],
      church_assignments: "",
    },
    otherAdults: [],
    children: [],
  });
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

    const rows = flattenHouseholdPersonsForm(parsed.data).map((entry) =>
      personInsertFromFlattenedEntry(householdId, entry),
    );

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

  const householdRole = (parsed.data.household_role ??
    "chef_de_famille") as FormHouseholdRole;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("persons")
      .update(memberFormValuesToPersonInsert(parsed.data, householdRole))
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
      .update(childFormValuesToPersonInsert(parsed.data))
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

  try {
    const supabase = createAdminClient();

    for (const entry of flattenHouseholdPersonsForm(parsed.data)) {
    if (entry.kind === "adult") {
      const { id: memberId, ...memberData } = entry.values;
      const personId = memberId?.trim() ? memberId.trim() : undefined;

      if (personId) {
        const { data, error } = await supabase
          .from("persons")
          .update(memberFormValuesToPersonInsert(memberData, entry.role))
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
          .insert(personInsertFromFlattenedEntry(householdId, entry))
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
  } catch (err) {
    const message =
      err instanceof Error ? err.message : tErrors("updateMemberFailed");
    return failure(message);
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

  const first = parsedMembers.data[0];
  return upsertHouseholdPersons(householdId, {
    locale,
    head: first,
    spouse: {
      civility: "",
      first_name: "",
      last_name: "",
      age: "",
      email: "",
      phone: "",
      preferred_language: "fr",
      is_visible_in_directory: true,
      is_baptized: false,
      baptized_since: "",
      is_mpiandry: false,
      mpiandry_since: "",
      is_mpandray: false,
      mpandray_since: "",
      branches: [],
      church_assignments: "",
    },
    otherAdults: [],
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
