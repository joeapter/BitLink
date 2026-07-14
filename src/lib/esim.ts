// eSIM activation-string helpers.
//
// Phones only accept the full LPA scheme ("LPA:1$<smdp>$<code>") in QR codes
// and manual entry. Annatel's API returns the bare "1$<smdp>$<code>" form,
// and one early line was stored that way (fixed in data on 2026-07-14, but
// every display surface normalizes defensively now — an invalid QR in the
// admin console cost a real debugging session).

export function toLpaString(activationCode: string, smDpPlus?: string | null): string {
  if (activationCode.startsWith('LPA:')) return activationCode;
  if (activationCode.startsWith('1$')) return `LPA:${activationCode}`;
  if (smDpPlus) return `LPA:1$${smDpPlus}$${activationCode}`;
  return activationCode;
}
