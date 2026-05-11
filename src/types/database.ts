export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "customer" | "admin";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      plans: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          monthly_price_cents: number;
          currency: string;
          stripe_price_id: string | null;
          features: Json;
          sort_order: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["plans"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          stripe_customer_id: string | null;
          referral_code: string | null;
          referred_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          plan_id: string | null;
          stripe_checkout_session_id: string | null;
          payment_status: string;
          order_status: string;
          provisioning_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string | null;
          plan_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
      provisioning_events: {
        Row: {
          id: string;
          order_id: string | null;
          customer_id: string | null;
          status: string;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provisioning_events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["provisioning_events"]["Row"]>;
      };
      support_tickets: {
        Row: {
          id: string;
          customer_id: string | null;
          subject: string;
          message: string;
          status: string;
          priority: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_customer_id: string | null;
          referred_customer_id: string | null;
          referral_code: string | null;
          status: string;
          reward_type: string | null;
          reward_value_cents: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["referrals"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["referrals"]["Row"]>;
      };
      payment_events: {
        Row: {
          id: string;
          customer_id: string | null;
          stripe_event_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["payment_events"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["payment_events"]["Row"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
