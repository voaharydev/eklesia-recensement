export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Affectation à une branche (stockée dans persons.branches). */
export type PersonBranchAssignment = {
  branch_code: string;
  role: string | null;
};

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          main_address: string;
          created_at: string;
          unregistered_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          main_address: string;
          created_at?: string;
          unregistered_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          main_address?: string;
          created_at?: string;
          unregistered_at?: string | null;
        };
        Relationships: [];
      };
      persons: {
        Row: {
          id: string;
          household_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          preferred_language: string;
          is_visible_in_directory: boolean;
          is_baptized: boolean;
          baptized_since: string | null;
          is_mpiandry: boolean;
          mpiandry_since: string | null;
          is_mpandray: boolean;
          mpandray_since: string | null;
          is_child: boolean;
          age: number | null;
          branches: PersonBranchAssignment[];
          church_assignments: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          preferred_language?: string;
          is_visible_in_directory?: boolean;
          is_baptized?: boolean;
          baptized_since?: string | null;
          is_mpiandry?: boolean;
          mpiandry_since?: string | null;
          is_mpandray?: boolean;
          mpandray_since?: string | null;
          is_child?: boolean;
          age?: number | null;
          branches?: PersonBranchAssignment[];
          church_assignments?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          preferred_language?: string;
          is_visible_in_directory?: boolean;
          is_baptized?: boolean;
          baptized_since?: string | null;
          is_mpiandry?: boolean;
          mpiandry_since?: string | null;
          is_mpandray?: boolean;
          mpandray_since?: string | null;
          is_child?: boolean;
          age?: number | null;
          branches?: PersonBranchAssignment[];
          church_assignments?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "persons_household_id_fkey";
            columns: ["household_id"];
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Household = Tables<"households">;
export type Person = Tables<"persons">;
export type HouseholdInsert = TablesInsert<"households">;
export type PersonInsert = TablesInsert<"persons">;
