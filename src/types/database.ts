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
      // ── Telecom schema (migration 002) ───────────────────────────
      telecom_lines: {
        Row: {
          id: string;
          provider_id: string;
          provider_line_id: string | null;
          external_id: string;
          customer_id: string | null;
          status: string;
          is_kosher: boolean;
          language: string | null;
          metadata: Json;
          status_transitions: Json;
          created_at: string;
          updated_at: string;
          terminated_at: string | null;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["telecom_lines"]["Row"]> & { external_id: string };
        Update: Partial<Database["public"]["Tables"]["telecom_lines"]["Row"]>;
      };
      phone_numbers: {
        Row: {
          id: string;
          line_id: string;
          number: string;
          provider_did_id: string | null;
          is_primary: boolean;
          is_ported: boolean;
          ported_from_operator: string | null;
          ported_to_operator: string | null;
          is_open_to_port_out: boolean;
          is_technical: boolean;
          start_at: string;
          end_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["phone_numbers"]["Row"]> & { line_id: string; number: string };
        Update: Partial<Database["public"]["Tables"]["phone_numbers"]["Row"]>;
      };
      sim_profiles: {
        Row: {
          id: string;
          line_id: string | null;
          icc_id: string;
          imsi: string | null;
          msisdn: string | null;
          eid: string | null;
          is_esim: boolean;
          provider_id: string;
          provider_status: string | null;
          status: string;
          profile_type: string | null;
          mno_id: string | null;
          assigned_at: string | null;
          activated_at: string | null;
          status_transitions: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["sim_profiles"]["Row"]> & { icc_id: string };
        Update: Partial<Database["public"]["Tables"]["sim_profiles"]["Row"]>;
      };
      line_plans: {
        Row: {
          id: string;
          line_id: string;
          plan_name: string;
          provider_plan_id: string | null;
          is_main: boolean;
          is_topup: boolean;
          start_at: string;
          end_at: string | null;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["line_plans"]["Row"]> & { line_id: string; plan_name: string };
        Update: Partial<Database["public"]["Tables"]["line_plans"]["Row"]>;
      };
      provisioning_jobs: {
        Row: {
          id: string;
          line_id: string | null;
          provider_job_id: string | null;
          idempotency_key: string;
          type: string;
          status: string;
          attempt_count: number;
          max_attempts: number;
          payload: Json;
          result: Json | null;
          error: string | null;
          next_retry_at: string | null;
          status_transitions: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          created_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["provisioning_jobs"]["Row"]> & {
          idempotency_key: string;
          type: string;
          payload: Json;
        };
        Update: Partial<Database["public"]["Tables"]["provisioning_jobs"]["Row"]>;
      };
      suspension_history: {
        Row: {
          id: string;
          line_id: string;
          suspension_type: string;
          provider_suspension_id: string | null;
          reason: string;
          suspended_by: string | null;
          suspended_at: string;
          reactivated_by: string | null;
          reactivated_at: string | null;
          is_active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["suspension_history"]["Row"]> & {
          line_id: string;
          suspension_type: string;
          reason: string;
        };
        Update: Partial<Database["public"]["Tables"]["suspension_history"]["Row"]>;
      };
      webhook_events: {
        Row: {
          id: string;
          provider_id: string;
          provider_event_id: string | null;
          received_at: string;
          headers: Json;
          raw_payload: string;
          parsed_payload: Json | null;
          event_type: string | null;
          signature_valid: boolean | null;
          status: string;
          processed_at: string | null;
          error: string | null;
          attempt_count: number;
          idempotency_key: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["webhook_events"]["Row"]> & {
          headers: Json;
          raw_payload: string;
        };
        Update: Partial<Database["public"]["Tables"]["webhook_events"]["Row"]>;
      };
      telecom_events: {
        Row: {
          id: string;
          event_type: string;
          aggregate_type: string;
          aggregate_id: string | null;
          payload: Json;
          source: string;
          source_event_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["telecom_events"]["Row"]> & {
          event_type: string;
          aggregate_type: string;
          payload: Json;
          source: string;
        };
        Update: Partial<Database["public"]["Tables"]["telecom_events"]["Row"]>;
      };
      ocs_balance_snapshots: {
        Row: {
          id: string;
          line_id: string;
          snapshotted_at: string;
          balances: Json;
          is_stale: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["ocs_balance_snapshots"]["Row"]> & {
          line_id: string;
          balances: Json;
        };
        Update: Partial<Database["public"]["Tables"]["ocs_balance_snapshots"]["Row"]>;
      };
      provider_sync_logs: {
        Row: {
          id: string;
          provider_id: string;
          operation: string;
          request_url: string | null;
          request_method: string | null;
          request_headers: Json | null;
          request_payload: Json | null;
          response_payload: Json | null;
          response_headers: Json | null;
          http_status: number | null;
          duration_ms: number | null;
          succeeded: boolean;
          error: string | null;
          correlation_id: string | null;
          provider_job_id: string | null;
          telecom_line_id: string | null;
          provisioning_job_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["provider_sync_logs"]["Row"]> & {
          operation: string;
          succeeded: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["provider_sync_logs"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
