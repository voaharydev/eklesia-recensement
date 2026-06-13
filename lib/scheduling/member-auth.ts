import { createAdminClient } from "@/lib/supabase/supabase";
import { normalizeEmailForLookup } from "@/lib/registration/mappers";
import { getAuthenticatedUserEmail } from "@/lib/supabase/server-auth";
import type { Person } from "@/types/database";

function personEmailMatches(
  email: string | null,
  normalizedEmail: string,
): boolean {
  return email != null && email.trim().toLowerCase() === normalizedEmail;
}

export async function getAuthenticatedPerson(): Promise<Person | null> {
  const authEmail = await getAuthenticatedUserEmail();
  if (!authEmail) return null;

  const normalizedEmail = normalizeEmailForLookup(authEmail);
  const supabase = createAdminClient();

  const { data: candidates, error } = await supabase
    .from("persons")
    .select("*")
    .ilike("email", normalizedEmail)
    .limit(20);

  if (error || !candidates?.length) return null;

  return (
    candidates.find((person) =>
      personEmailMatches(person.email, normalizedEmail),
    ) ?? null
  );
}
