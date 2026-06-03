import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

export async function assertHouseholdIsActive(
  supabase: AdminClient,
  householdId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("households")
    .select("unregistered_at")
    .eq("id", householdId)
    .single();

  if (error || !data) {
    return { ok: false, message: "Foyer introuvable." };
  }

  if (data.unregistered_at) {
    return {
      ok: false,
      message: "Ce foyer est désinscrit et ne peut plus être modifié.",
    };
  }

  return { ok: true };
}
