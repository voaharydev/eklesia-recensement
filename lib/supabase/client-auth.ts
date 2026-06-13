"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

export function createBrowserAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont requises.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
