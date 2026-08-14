// Ručno pisani tipovi baze (Faze 1–2).
// Napomena: `supabase gen types` sada traži Docker; kad zatreba, preći na
// auto-generisanje. Do tada: menjaš šemu → ažuriraj i ovaj fajl.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ActivityStatus =
  "proposed" | "accepted" | "declined" | "scheduled" | "completed" | "archived";
export type ResponseType = "yes" | "no" | "maybe";
export type Category =
  | "izlazak"
  | "putovanje"
  | "hrana"
  | "kultura"
  | "aktivnost"
  | "kod_kuce"
  | "ostalo";
export type Effort = "spontano" | "treba_planirati" | "veliki_poduhvat";
export type ProposalStatus = "pending" | "accepted" | "rejected" | "superseded";

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
      activities: {
        Row: {
          id: string;
          couple_id: string;
          created_by: string;
          title: string;
          description: string | null;
          category: Category;
          effort: Effort;
          estimated_cost: number | null;
          location_name: string | null;
          location_url: string | null;
          reference_url: string | null;
          deadline: string | null;
          status: ActivityStatus;
          scheduled_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id?: string;
          created_by?: string;
          title: string;
          description?: string | null;
          category?: Category;
          effort?: Effort;
          estimated_cost?: number | null;
          location_name?: string | null;
          location_url?: string | null;
          reference_url?: string | null;
          deadline?: string | null;
          status?: ActivityStatus;
          scheduled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: Category;
          effort?: Effort;
          estimated_cost?: number | null;
          location_name?: string | null;
          location_url?: string | null;
          reference_url?: string | null;
          deadline?: string | null;
          status?: ActivityStatus;
          scheduled_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          response: ResponseType;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id?: string;
          response: ResponseType;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          response?: ResponseType;
          note?: string | null;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          id: string;
          activity_id: string;
          actor_id: string | null;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          actor_id?: string | null;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
        Relationships: [];
      };
      date_proposals: {
        Row: {
          id: string;
          activity_id: string;
          proposed_by: string;
          proposed_at: string;
          note: string | null;
          status: ProposalStatus;
          responded_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          proposed_by?: string;
          proposed_at: string;
          note?: string | null;
          status?: ProposalStatus;
          responded_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: ProposalStatus;
          note?: string | null;
          responded_at?: string | null;
        };
        Relationships: [];
      };
      activity_notes: {
        Row: {
          id: string;
          activity_id: string;
          user_id: string;
          body: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          activity_id: string;
          user_id?: string;
          body?: string | null;
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          updated_at?: string;
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
      revive_activity: {
        Args: { activity_id: string };
        Returns: Database["public"]["Tables"]["activities"]["Row"];
      };
      propose_date: {
        Args: {
          p_activity_id: string;
          p_proposed_at: string;
          p_note?: string | null;
        };
        Returns: Database["public"]["Tables"]["date_proposals"]["Row"];
      };
      accept_date: {
        Args: { p_proposal_id: string };
        Returns: Database["public"]["Tables"]["activities"]["Row"];
      };
      cancel_schedule: {
        Args: { p_activity_id: string; p_reason: string };
        Returns: Database["public"]["Tables"]["activities"]["Row"];
      };
    };
    Enums: {
      activity_status: ActivityStatus;
      response_type: ResponseType;
      category: Category;
      effort: Effort;
      proposal_status: ProposalStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Couple = Database["public"]["Tables"]["couples"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type Response = Database["public"]["Tables"]["responses"]["Row"];
export type ActivityEvent =
  Database["public"]["Tables"]["activity_events"]["Row"];
export type DateProposal =
  Database["public"]["Tables"]["date_proposals"]["Row"];
export type ActivityNote =
  Database["public"]["Tables"]["activity_notes"]["Row"];
