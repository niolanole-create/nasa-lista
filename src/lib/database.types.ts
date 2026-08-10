// Ručno pisani tipovi baze za Fazu 1 (couples, profiles + RPC).
// Napomena: `supabase gen types` sada traži Docker; kad šema poraste
// (Faza 2+), preći na auto-generisanje uz Docker ili access token.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string;
          name: string | null;
          invite_code: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          invite_code: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          invite_code?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          accent_color: string | null;
          couple_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: string | null;
          couple_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          accent_color?: string | null;
          couple_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_couple: {
        Args: { couple_name?: string | null };
        Returns: Database["public"]["Tables"]["couples"]["Row"];
      };
      join_couple: {
        Args: { code: string };
        Returns: Database["public"]["Tables"]["couples"]["Row"];
      };
      current_couple_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Couple = Database["public"]["Tables"]["couples"]["Row"];
