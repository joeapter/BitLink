import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeIsraeliMobile } from '@/lib/utils';
import { getPlan, type PlanSlug } from '@/lib/plans';
import { resolveDeliveryMethod } from '@/lib/delivery';

export type AdminOrderLineInput = {
  planSlug: PlanSlug;
  isEsim: boolean;
  isPortIn: boolean;
  portNumber?: string | null;
  wantsIntlNumber: boolean;
  intlCountry?: 'us' | 'canada' | 'uk' | null;
  intlSource?: 'new' | 'port' | null;
  intlPortNumber?: string | null;
  intlChosenNumber?: string | null;
  iccId?: string | null;
  delivery?: {
    city: string;
    addressLine1: string;
    addressLine2?: string | null;
    requestedDate?: string | null;
  } | null;
  customPriceCents: number;
};

export type NormalizedAdminOrderLine = {
  planSlug: PlanSlug;
  isEsim: boolean;
  isPortIn: boolean;
  portNumber: string | null;
  wantsIntlNumber: boolean;
  intlCountry: 'us' | 'canada' | 'uk' | null;
  intlSource: 'new' | 'port' | null;
  intlPortNumber: string | null;
  intlChosenNumber: string | null;
  iccId: string | null;
  delivery: { method: 'courier' | 'israel_post'; city: string; addressLine1: string; addressLine2: string | null; requestedDate: string | null } | null;
  customPriceCents: number;
};

// Validates and normalizes admin-entered custom-order lines: port number
// format, international-number availability, and delivery method (always
// re-derived from city, never trusted from the client). Shared between
// "create a new payment link" and "add to an existing subscription" —
// both need identical validation so the two paths never drift apart.
// Throws a user-facing Error message on the first invalid line.
export async function normalizeAdminOrderLines(
  admin: SupabaseClient,
  rawLines: AdminOrderLineInput[],
): Promise<NormalizedAdminOrderLine[]> {
  return Promise.all(rawLines.map(async (line, index) => {
    const plan = getPlan(line.planSlug);
    const normalizedPort = line.isPortIn && line.portNumber
      ? normalizeIsraeliMobile(line.portNumber)
      : null;

    if (line.isPortIn && !normalizedPort) {
      throw new Error(`Line ${index + 1}: enter a valid Israeli mobile number to port.`);
    }

    if (line.wantsIntlNumber && (line.intlSource ?? 'new') === 'port' && !line.intlPortNumber?.trim()) {
      throw new Error(`Line ${index + 1}: enter the US/Canada/UK number to port.`);
    }

    const wantsNewIntlNumber = line.wantsIntlNumber && (line.intlSource ?? 'new') === 'new';
    let intlChosenNumber: string | null = null;
    if (wantsNewIntlNumber && line.intlChosenNumber?.trim()) {
      const candidate = line.intlChosenNumber.trim();
      const { data: available } = await admin
        .from('international_dids')
        .select('number')
        .eq('number', candidate)
        .eq('country', line.intlCountry ?? 'us')
        .eq('status', 'available')
        .maybeSingle();
      if (!available) {
        throw new Error(`Line ${index + 1}: that number is no longer available — pick another.`);
      }
      intlChosenNumber = candidate;
    }

    return {
      planSlug: line.planSlug,
      isEsim: plan.isKosher ? false : line.isEsim,
      isPortIn: line.isPortIn,
      portNumber: normalizedPort,
      wantsIntlNumber: line.wantsIntlNumber,
      intlCountry: line.wantsIntlNumber ? (line.intlCountry ?? 'us') : null,
      intlSource: line.wantsIntlNumber ? (line.intlSource ?? 'new') : null,
      intlPortNumber: line.wantsIntlNumber && (line.intlSource ?? 'new') === 'port'
        ? line.intlPortNumber!.trim()
        : null,
      intlChosenNumber,
      // Physical/kosher lines activate on a specific card entered by the
      // admin; eSIM lines auto-pick from inventory so this stays null.
      iccId: (plan.isKosher || !line.isEsim) ? (line.iccId?.replace(/\s+/g, '') || null) : null,
      delivery: (plan.isKosher || !line.isEsim) && line.delivery ? {
        method: resolveDeliveryMethod(line.delivery.city),
        city: line.delivery.city,
        addressLine1: line.delivery.addressLine1,
        addressLine2: line.delivery.addressLine2 || null,
        requestedDate: line.delivery.requestedDate || null,
      } : null,
      customPriceCents: line.customPriceCents,
    };
  }));
}
