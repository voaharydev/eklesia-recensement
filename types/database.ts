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

export type ServiceRoleCode =
  | "powerpoint"
  | "priere"
  | "lecture_1"
  | "lecture_2"
  | "lecture_3";

export type ServiceAssignmentStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "declined";

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          main_address: string;
          created_at: string;
          updated_at: string;
          unregistered_at: string | null;
          landline_phone: string | null;
          arrival_date_fjkm: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          main_address: string;
          created_at?: string;
          updated_at?: string;
          unregistered_at?: string | null;
          landline_phone?: string | null;
          arrival_date_fjkm?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          main_address?: string;
          created_at?: string;
          updated_at?: string;
          unregistered_at?: string | null;
          landline_phone?: string | null;
          arrival_date_fjkm?: string | null;
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
          is_mpamaky_teny: boolean;
          is_child: boolean;
          age: number | null;
          branches: PersonBranchAssignment[];
          church_assignments: string | null;
          civility: string | null;
          role: string;
          created_at: string;
          updated_at: string;
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
          is_mpamaky_teny?: boolean;
          is_child?: boolean;
          age?: number | null;
          branches?: PersonBranchAssignment[];
          church_assignments?: string | null;
          civility?: string | null;
          role: string;
          created_at?: string;
          updated_at?: string;
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
          is_mpamaky_teny?: boolean;
          is_child?: boolean;
          age?: number | null;
          branches?: PersonBranchAssignment[];
          church_assignments?: string | null;
          civility?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
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
      services: {
        Row: {
          id: string;
          service_date: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_date: string;
          title?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          service_date?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      service_assignments: {
        Row: {
          id: string;
          service_id: string;
          person_id: string;
          role_code: ServiceRoleCode;
          status: ServiceAssignmentStatus;
          decline_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          service_id: string;
          person_id: string;
          role_code: ServiceRoleCode;
          status?: ServiceAssignmentStatus;
          decline_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          service_id?: string;
          person_id?: string;
          role_code?: ServiceRoleCode;
          status?: ServiceAssignmentStatus;
          decline_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_assignments_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_assignments_person_id_fkey";
            columns: ["person_id"];
            referencedRelation: "persons";
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
export type Service = Tables<"services">;
export type ServiceAssignment = Tables<"service_assignments">;
export type HouseholdInsert = TablesInsert<"households">;
export type PersonInsert = TablesInsert<"persons">;
export type ServiceInsert = TablesInsert<"services">;
export type ServiceAssignmentInsert = TablesInsert<"service_assignments">;
