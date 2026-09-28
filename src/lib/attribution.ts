// First-touch attribution.
//
// Coded traffic has been tracked for a while — bl_org for partner and org
// links, ref/referral for a Rep's code. Uncoded traffic had nothing, which is
// most people: on 2026-09-28 a customer bought Student 5G with no code of any
// kind, and the only way to guess where she came from was to read GA4 channel
// totals afterwards and shrug. That is the gap this closes.
//
// FIRST touch, not last. The interesting page is the one that found them — a
// guide, a landing page, a search result — not /plans, which is simply where
// everyone is standing when they pay. So the cookie is written once and never
// overwritten while it lives.
//
// Deliberately small. GA4 already does channel-level reporting well and this is
// not trying to replace it; it answers the one question GA4 cannot, which is
// which specific customer came from which specific page.

/** Cookie holding the first-touch record. 90 days: long enough to cover a guide read in
 *  one week and a purchase the next, short enough that it is still meaningful. */
export const ATTRIBUTION_COOKIE = 'bl_attr';
export const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export interface Attribution {
  /** Path they first landed on, e.g. /guides/us-number-for-olim-in-israel */
  landing: string;
  /** Referring host only — google.com, chatgpt.com. Never the full URL: query
   *  strings on a referrer can carry someone else's search terms or session ids. */
  referrer: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  /** When they first arrived, ISO. */
  at: string;
}

/** Keep the cookie well under the 4KB limit and out of the database's way. */
function clamp(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * Build a first-touch record from an incoming request.
 *
 * Returns null for traffic not worth recording — our own pages referring to
 * each other, and asset or API routes nobody "lands" on.
 */
export function buildAttribution(params: {
  pathname: string;
  searchParams: URLSearchParams;
  referrerHeader: string | null;
  selfHost: string | null;
}): Attribution | null {
  const { pathname, searchParams, referrerHeader, selfHost } = params;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return null;

  let referrerHost: string | null = null;
  if (referrerHeader) {
    try {
      const host = new URL(referrerHeader).hostname.replace(/^www\./, '');
      // An internal referrer means this is not the landing page — they were
      // already here, so recording it would overwrite the real first touch with
      // wherever they happened to click next.
      if (selfHost && host === selfHost.replace(/^www\./, '')) return null;
      referrerHost = host;
    } catch {
      referrerHost = null;
    }
  }

  return {
    landing: clamp(pathname, 200) ?? '/',
    referrer: clamp(referrerHost, 100),
    source: clamp(searchParams.get('utm_source'), 60),
    medium: clamp(searchParams.get('utm_medium'), 60),
    campaign: clamp(searchParams.get('utm_campaign'), 80),
    at: new Date().toISOString(),
  };
}

export function encodeAttribution(attribution: Attribution): string {
  return encodeURIComponent(JSON.stringify(attribution));
}

/** Tolerant by design: a malformed or hand-edited cookie must never break a sale. */
export function decodeAttribution(raw: string | undefined | null): Attribution | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Attribution>;
    if (!parsed || typeof parsed.landing !== 'string') return null;
    return {
      landing: parsed.landing,
      referrer: typeof parsed.referrer === 'string' ? parsed.referrer : null,
      source: typeof parsed.source === 'string' ? parsed.source : null,
      medium: typeof parsed.medium === 'string' ? parsed.medium : null,
      campaign: typeof parsed.campaign === 'string' ? parsed.campaign : null,
      at: typeof parsed.at === 'string' ? parsed.at : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * One human-readable line for an admin table — "google.com → /guides/…".
 * Returns null when there is nothing worth showing.
 */
export function describeAttribution(attribution: Attribution | null): string | null {
  if (!attribution) return null;
  const from = attribution.referrer ?? (attribution.source ? `${attribution.source}` : 'direct');
  return `${from} → ${attribution.landing}`;
}
