import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type AdminClient = SupabaseClient<Database>;

type ErrorTranslator = (key: string) => string;

export async function assertHouseholdIsActive(
  supabase: AdminClient,
  householdId: string,
  t: ErrorTranslator,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("households")
    .select("unregistered_at")
    .eq("id", householdId)
    .single();

  if (error || !data) {
    return { ok: false, message: t("householdNotFound") };
  }

  if (data.unregistered_at) {
    return { ok: false, message: t("householdUnregistered") };
  }

  return { ok: true };
}
