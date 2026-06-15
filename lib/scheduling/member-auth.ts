import { personHasEmail } from "@/lib/contacts/person-contacts";
import { createAdminClient } from "@/lib/supabase/supabase";
import { normalizeEmailForLookup } from "@/lib/registration/mappers";
import { getAuthenticatedUserEmail } from "@/lib/supabase/server-auth";
import type { Person } from "@/types/database";

export async function getAuthenticatedPerson(): Promise<Person | null> {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) return null;

  const normalizedEmail = normalizeEmailForLookup(authEmail);
  const supabase = createAdminClient();

  const { data: candidates, error } = await supabase
    .from("persons")
    .select("*")
    .contains("emails", [normalizedEmail])
    .limit(20);

  if (error || !candidates?.length) return null;

  return (
    candidates.find((person) =>
      personHasEmail(person, normalizedEmail),
    ) ?? null
  );
}
