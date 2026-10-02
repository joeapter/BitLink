// The temporary number move.
//
// A customer abroad needs a verification code — WhatsApp, a bank, a government
// portal — that is sent to their Israeli number. SMS-to-email covers most of
// it, but sometimes the SMS simply never arrives and the only fallback the
// sender offers is a VOICE call to the number. A voice call cannot be
// forwarded to an inbox: something has to physically ring in Israel.
//
// So we borrow the number. The customer's DID is detached from their carrier
// line and attached to the office line for a few minutes, the call rings here,
// the code is read out and passed to the customer, and the number goes back.
//
// Done by hand this is four carrier calls with a customer's phone number in
// the middle of them, and it has an unobvious trap (see SMS FORWARDERS below)
// that silently costs the customer the feature they bought. Hence a button.
//
// WHAT THIS DELIBERATELY DOES NOT TOUCH
//
// telecom_lines.metadata.phone_number stays exactly as it is. That field is
// what the customer portal displays and what collectUsedNumbers() reads to keep
// a number out of the provisioning pool — clearing it during a loan would both
// confuse the customer and make the number look free, so a new line could be
// handed the number that is sitting on the office line. The loan is a carrier
// fact only; as far as BitLink is concerned the number is still theirs, which
// is also the truth.
//
// SMS FORWARDERS — the trap
//
// A forwarder belongs to the line↔DID *association*, not to the DID. Detaching
// stamps end_at on that association and re-attaching creates a brand new one
// with a new id, so every forwarder configured on the number is gone the moment
// it is detached and does NOT come back on its own. For a customer abroad the
// forwarder is usually the entire reason they bought the line. We therefore
// record the forwarders before the move and re-create them on return.
//
// Annatel will not even let you skip this: detaching a DID that still has a
// live forwarder is refused with 422 `{"number":["ongoing sms_forwarder_setting
// constraint"]}` (hit on the first real move, 2026-09-29). So the forwarders
// must be deleted explicitly before the detach — which is exactly why they have
// to be read and stashed first, or they are simply gone.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTelecomProvider } from '@/lib/telecom/provider.registry';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'number-loan' });

/**
 * Joe's own line — the handset that answers the borrowed number.
 *
 * Carrier line fb535de3… , BitLink line e222f575… . Its own number is
 * +972555195335 and it also carries +972555195375, the number on the website's
 * wa.me links, plus two North American DIDs. A line holding several DIDs at
 * once is normal at Annatel, which is what makes this maneuver safe: the
 * borrowed number arrives alongside the others and nothing on the line is
 * disturbed.
 */
export const OFFICE_LINE = {
  lineId: 'e222f575-f5d2-42e2-8a6a-d0a158eb7ea1',
  providerLineId: 'fb535de3-abc9-4b2a-8979-96eb437bfdcd',
  label: 'Joe’s line',
  /** Where SMS to the borrowed number goes for the duration of the loan. */
  email: 'joeapter@gmail.com',
} as const;

/** What we stash on the customer's line so the return is exact and reversible. */
export interface NumberLoan {
  number: string;
  /** Carrier line it was borrowed FROM — always the customer's own. */
  fromProviderLineId: string;
  /** Carrier line it is sitting on right now. */
  toProviderLineId: string;
  movedAt: string;
  movedBy: string | null;
  /** Forwarders that were live on the number before the move, to be restored. */
  smsForwarders: Array<{ emailRecipientAddress?: string; telegramChatId?: string }>;
}

export interface LoanResult {
  success: boolean;
  error?: string;
  number?: string;
  /** Forwarders captured (loan) or put back (return) — surfaced so the admin
   *  can see the customer's setup survived rather than having to trust it. */
  restoredForwarders?: number;
}

export function readLoan(metadata: unknown): NumberLoan | null {
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const loan = meta.number_loan as NumberLoan | undefined;
  if (!loan || typeof loan.number !== 'string' || typeof loan.toProviderLineId !== 'string') return null;
  return loan;
}

async function writeLoan(admin: SupabaseClient, lineId: string, loan: NumberLoan | null) {
  const { data } = await admin.from('telecom_lines').select('metadata').eq('id', lineId).maybeSingle();
  const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
  const { number_loan: _dropped, ...rest } = metadata;
  await admin
    .from('telecom_lines')
    .update({
      metadata: loan ? { ...rest, number_loan: loan } : rest,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lineId);
}

/**
 * Borrow the customer's number onto the office line.
 *
 * Order matters: capture forwarders, detach, attach. If the attach fails the
 * number is put straight back, because the one outcome worse than a failed
 * maneuver is a number attached to nothing — the customer would lose service
 * with no record of where their number went.
 */
export async function loanNumberToOffice(
  admin: SupabaseClient,
  params: { lineId: string; providerLineId: string; number?: string | null; actorId?: string | null },
): Promise<LoanResult> {
  const { lineId, providerLineId, number = null, actorId = null } = params;
  const provider = getTelecomProvider();

  const { data: line } = await admin
    .from('telecom_lines')
    .select('metadata, status')
    .eq('id', lineId)
    .maybeSingle();
  if (!line) return { success: false, error: 'Line not found.' };

  if (readLoan(line.metadata)) {
    return { success: false, error: 'This number is already on loan. Return it before moving it again.' };
  }
  if (providerLineId === OFFICE_LINE.providerLineId) {
    return { success: false, error: 'That is the office line — there is nothing to borrow.' };
  }

  // Take the number from the carrier rather than our metadata: the carrier is
  // the thing we are about to change, and if the two ever disagree it is the
  // carrier that decides whether the detach succeeds.
  const assigned = await provider.getAssignedNumbers(providerLineId);
  const israeli = assigned.filter((n) => n.number.startsWith('+972'));
  if (israeli.length === 0) {
    return { success: false, error: 'This line has no Israeli number attached at the carrier.' };
  }
  // A line can carry a paid extra Israeli number, so the admin picks which one
  // goes. The choice is checked against the carrier, never trusted from the form.
  let did = israeli[0];
  if (number) {
    const chosen = israeli.find((n) => n.number === number);
    if (!chosen) {
      return {
        success: false,
        error: `${number} is not attached to this line at the carrier (it has ${israeli.map((n) => n.number).join(', ')}). Nothing was moved.`,
      };
    }
    did = chosen;
  } else if (israeli.length > 1) {
    return {
      success: false,
      error:
        `This line has ${israeli.length} Israeli numbers (${israeli.map((n) => n.number).join(', ')}). ` +
        `Pick which one to move.`,
    };
  }

  // Capture before detaching — after the detach the association is closed and
  // these are unreadable.
  // Every per-number sub-resource is addressed by the line↔DID id, so without
  // it the forwarders can be neither read nor put back. Annatel always returns
  // one; refuse rather than move a number we cannot restore.
  if (!did.id) {
    return { success: false, error: 'The carrier did not return an id for this number, so its SMS forwarding cannot be preserved. Nothing was moved.' };
  }

  let smsForwarders: NumberLoan['smsForwarders'] = [];
  try {
    const existing = (await provider.listLineDidSmsForwarders(providerLineId, did.id)).filter((f) => !f.endAt);
    smsForwarders = existing.map((f) => ({
      emailRecipientAddress: f.emailRecipientAddress,
      telegramChatId: f.telegramChatId,
    }));
  } catch (err) {
    // Without this list the return would silently drop the customer's
    // forwarding, which is exactly the failure this function exists to prevent.
    return {
      success: false,
      error: `Could not read the SMS forwarding on this number (${err instanceof Error ? err.message : String(err)}). Nothing was moved.`,
    };
  }

  // Record the loan BEFORE touching the carrier. If the process dies halfway
  // the admin still sees a loan in progress and can press Return; the reverse
  // ordering would lose the number with no trace of where it went.
  const loan: NumberLoan = {
    number: did.number,
    fromProviderLineId: providerLineId,
    toProviderLineId: OFFICE_LINE.providerLineId,
    movedAt: new Date().toISOString(),
    movedBy: actorId,
    smsForwarders,
  };
  await writeLoan(admin, lineId, loan);

  try {
    // Must happen before the detach — the carrier refuses to release a DID that
    // still has a live forwarder. They are already stashed in the loan record.
    await clearForwarders(provider, providerLineId, did.id);
    await provider.releaseDid(providerLineId, did.number);
  } catch (err) {
    // Nothing has moved, but a forwarder may already have been deleted, so put
    // the customer's setup back before giving up.
    await restoreForwarders(provider, providerLineId, did.number, smsForwarders).catch(() => {});
    await writeLoan(admin, lineId, null);
    return {
      success: false,
      error: `Could not detach the number (${err instanceof Error ? err.message : String(err)}). Nothing was moved.`,
    };
  }

  try {
    await provider.assignDid(OFFICE_LINE.providerLineId, did.number);
  } catch (err) {
    const attachError = err instanceof Error ? err.message : String(err);

    // Put it straight back where it came from. Re-attaching and restoring the
    // forwarding are reported separately: the number being back is what decides
    // whether the customer has service, and rolling them into one catch would
    // announce a lost number every time a forwarder failed to re-create.
    try {
      await provider.assignDid(providerLineId, did.number);
    } catch {
      // Both ends failed. The loan record stays so Return can finish the job.
      log.error({ lineId, number: did.number, attachError }, 'Number detached but not re-attached');
      return {
        success: false,
        error:
          `The number was detached but could not be attached to ${OFFICE_LINE.label} OR put back (${attachError}). ` +
          `It is currently on no line — press “Return to customer” to retry. Number: ${did.number}`,
      };
    }

    try {
      await restoreForwarders(provider, providerLineId, did.number, smsForwarders);
    } catch {
      await writeLoan(admin, lineId, null);
      return {
        success: false,
        error:
          `Could not attach the number to ${OFFICE_LINE.label} (${attachError}). ${did.number} is back on the ` +
          `customer's line, but their SMS forwarding was not restored — re-add it: ` +
          smsForwarders.map((f) => f.emailRecipientAddress ?? f.telegramChatId).join(', '),
      };
    }

    await writeLoan(admin, lineId, null);
    return {
      success: false,
      error: `Could not attach the number to ${OFFICE_LINE.label} (${attachError}). It has been put back on the customer's line.`,
    };
  }

  // Forward SMS to the office for the duration, so a code sent by text lands
  // here too rather than only the voice call. Removed again on return.
  try {
    const officeDids = await provider.getAssignedNumbers(OFFICE_LINE.providerLineId);
    const onOffice = officeDids.find((n) => n.number === did.number);
    if (onOffice?.id) {
      await provider.addLineDidSmsForwarder(OFFICE_LINE.providerLineId, onOffice.id, {
        emailRecipientAddress: OFFICE_LINE.email,
      });
    }
  } catch {
    // Nice to have, not the point of the exercise — the voice call works either
    // way, and leaving the loan in place is better than unwinding it for this.
  }

  log.info({ lineId, number: did.number, forwarders: smsForwarders.length }, 'Number loaned to office line');
  return { success: true, number: did.number, restoredForwarders: smsForwarders.length };
}

/**
 * Take every live forwarder off a line↔DID association.
 *
 * Required before any detach: Annatel answers 422 `ongoing
 * sms_forwarder_setting constraint` otherwise. Only ever called once the
 * forwarders are safely recorded.
 */
async function clearForwarders(
  provider: ReturnType<typeof getTelecomProvider>,
  providerLineId: string,
  didId: string,
): Promise<void> {
  const existing = await provider.listLineDidSmsForwarders(providerLineId, didId);
  for (const f of existing) {
    if (f.endAt) continue;
    await provider.removeLineDidSmsForwarder(providerLineId, didId, f.id);
  }
}

async function restoreForwarders(
  provider: ReturnType<typeof getTelecomProvider>,
  providerLineId: string,
  number: string,
  forwarders: NumberLoan['smsForwarders'],
): Promise<number> {
  if (forwarders.length === 0) return 0;
  // Re-read: the association was just created, so its id is new.
  const assigned = await provider.getAssignedNumbers(providerLineId);
  const did = assigned.find((n) => n.number === number);
  // Throwing rather than returning 0: the caller turns this into a message
  // naming the forwarders to re-add by hand. Returning quietly would leave the
  // customer's forwarding off with a success message on screen.
  if (!did?.id) {
    throw new Error(`${number} is not back on the line yet, or the carrier returned no id for it`);
  }

  let restored = 0;
  for (const f of forwarders) {
    if (!f.emailRecipientAddress && !f.telegramChatId) continue;
    await provider.addLineDidSmsForwarder(providerLineId, did.id, {
      emailRecipientAddress: f.emailRecipientAddress,
      telegramChatId: f.telegramChatId,
    });
    restored++;
  }
  return restored;
}

/**
 * Give the number back, with the customer's SMS forwarding as it was.
 *
 * Tolerant of a half-finished loan: if the number is already off the office
 * line, or already back on the customer's, the missing step is skipped rather
 * than treated as an error. Pressing this twice is safe.
 */
export async function returnLoanedNumber(
  admin: SupabaseClient,
  params: { lineId: string },
): Promise<LoanResult> {
  const { lineId } = params;
  const provider = getTelecomProvider();

  const { data: line } = await admin
    .from('telecom_lines')
    .select('metadata')
    .eq('id', lineId)
    .maybeSingle();
  if (!line) return { success: false, error: 'Line not found.' };

  const loan = readLoan(line.metadata);
  if (!loan) return { success: false, error: 'This number is not on loan.' };

  // Clear the office end first — a DID cannot sit on two lines, so this has to
  // happen before the customer's line will take it back.
  try {
    const officeDids = await provider.getAssignedNumbers(loan.toProviderLineId);
    const onOffice = officeDids.find((n) => n.number === loan.number);
    if (onOffice) {
      // The office copy-to-inbox forwarder added during the loan blocks the
      // detach exactly as the customer's own did, so it comes off first.
      if (onOffice.id) await clearForwarders(provider, loan.toProviderLineId, onOffice.id);
      await provider.releaseDid(loan.toProviderLineId, loan.number);
    }
  } catch (err) {
    return {
      success: false,
      error: `Could not take the number off ${OFFICE_LINE.label} (${err instanceof Error ? err.message : String(err)}). The customer's line is unchanged — try again.`,
    };
  }

  try {
    const customerDids = await provider.getAssignedNumbers(loan.fromProviderLineId);
    if (!customerDids.some((n) => n.number === loan.number)) {
      await provider.assignDid(loan.fromProviderLineId, loan.number);
    }
  } catch (err) {
    return {
      success: false,
      error:
        `The number is off ${OFFICE_LINE.label} but would not attach back to the customer (${err instanceof Error ? err.message : String(err)}). ` +
        `The customer has no service on ${loan.number} — press Return again, or attach it by hand.`,
    };
  }

  let restored = 0;
  try {
    restored = await restoreForwarders(provider, loan.fromProviderLineId, loan.number, loan.smsForwarders);
  } catch (err) {
    // The number is back, which is the part that matters; say plainly that the
    // forwarding is not, because silently losing it is the whole trap here.
    log.error({ lineId, number: loan.number, err }, 'Forwarders not restored after loan');
    await writeLoan(admin, lineId, null);
    return {
      success: false,
      error:
        `${loan.number} is back on the customer's line, but their SMS forwarding could not be restored ` +
        `(${err instanceof Error ? err.message : String(err)}). Re-add it: ` +
        loan.smsForwarders.map((f) => f.emailRecipientAddress ?? f.telegramChatId).join(', '),
    };
  }

  await writeLoan(admin, lineId, null);
  log.info({ lineId, number: loan.number, restored }, 'Loaned number returned to customer');
  return { success: true, number: loan.number, restoredForwarders: restored };
}
