// Where a Rep's link goes, and what their sharable URL is.
//
// A Rep shares /r/<code>, never a destination URL directly. The destination is
// a property of the Rep (affiliates.landing) resolved when someone clicks, so
// switching a Rep from the free trial to the plans page takes effect on every
// link they have already sent — including ones sitting in WhatsApp threads
// from weeks ago. Handing out /trial?ref=CODE would have frozen the choice at
// the moment of sharing.
//
// The older /trial?ref=CODE and /plans?ref=CODE forms still work; both pages
// read the code themselves. This just stops new links being minted that way.

export type RepLanding = "trial" | "plans";

export const REP_LANDINGS: ReadonlyArray<{ value: RepLanding; label: string; hint: string }> = [
  { value: "trial", label: "Free trial", hint: "Sends people to the free-month signup." },
  { value: "plans", label: "Plans page", hint: "Sends people straight to the paid plans." },
];

export function isRepLanding(value: unknown): value is RepLanding {
  return value === "trial" || value === "plans";
}

/** Codes are stored and matched uppercase — see normalizeCode in rep-actions. */
const CODE = /^[A-Z0-9-]{1,32}$/;

export function isRepCode(value: string): boolean {
  return CODE.test(value);
}

/** The stable link a Rep shares. */
export function repSharePath(code: string): string {
  return `/r/${encodeURIComponent(code.toUpperCase())}`;
}

/**
 * Where /r/<code> sends a visitor. The code rides along as ?ref= so the
 * destination page attributes the visit exactly as it does today.
 */
export function repDestinationPath(code: string, landing: RepLanding): string {
  const base = landing === "plans" ? "/plans" : "/trial";
  return `${base}?ref=${encodeURIComponent(code.toUpperCase())}`;
}

/**
 * Bumped whenever the share card's artwork changes.
 *
 * The image response is cached hard on purpose — a scraper hitting it on every
 * share would otherwise re-render it each time — and the URL is the cache key.
 * Without this, a redesign only reaches people whose previews hadn't been
 * cached yet. Appended to the og:image URL, not read by the route.
 */
export const REP_OG_VERSION = "2";

/** The share-card URL for a Rep, cache-busted by REP_OG_VERSION. */
export function repOgImagePath(code: string): string {
  return `/api/og/rep?code=${encodeURIComponent(code.toUpperCase())}&v=${REP_OG_VERSION}`;
}
