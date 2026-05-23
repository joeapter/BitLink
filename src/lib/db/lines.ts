import type { SupabaseClient } from '@supabase/supabase-js';
import type { LineStatusTransition } from '@/lib/provisioning/state-machines/line';

export interface LineRecord {
  id: string;
  external_id: string;
  status: string;
  provider_id: string;
  provider_line_id: string | null;
  customer_id: string | null;
  is_kosher: boolean;
  language: string | null;
  metadata: Record<string, unknown>;
  status_transitions: LineStatusTransition[];
  created_at: string;
  updated_at: string;
}

export async function getLine(
  admin: SupabaseClient,
  id: string,
): Promise<LineRecord | null> {
  const { data, error } = await admin
    .from('telecom_lines')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  const row = data as Record<string, unknown>;
  return {
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    status_transitions: ((row.status_transitions as unknown) ?? []) as LineStatusTransition[],
  } as unknown as LineRecord;
}

export async function updateLine(
  admin: SupabaseClient,
  id: string,
  updates: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin
    .from('telecom_lines')
    .update(updates as never)
    .eq('id', id);
  if (error) throw new Error(`Failed to update line ${id}: ${error.message}`);
}
