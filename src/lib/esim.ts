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

// Apple's universal link (iOS 17.4+) installs an eSIM directly when opened
// in Safari on the same iPhone that's meant to receive it — no camera, no
// second device. Works for any carrier's valid LPA string; no enrollment
// needed. This is the fix for "I got the email on the same phone, how do I
// scan the QR" — the single most common install-support question.
export function buildAppleEsimInstallUrl(lpaString: string): string {
  return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpaString)}`;
}
