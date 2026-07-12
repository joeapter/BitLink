"use client";

import { Analytics } from "@vercel/analytics/next";

// Drop internal surfaces from Vercel Web Analytics so traffic numbers reflect
// visitors, not our own admin/portal sessions. GA4 gets the same exclusion via
// the inline gtag guard in app/layout.tsx. Unlike that guard (initial-load
// only), beforeSend also catches client-side navigations into these routes.
const EXCLUDED_PATHS = /^\/(admin|account)(\/|$)/;

export function WebAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          if (EXCLUDED_PATHS.test(new URL(event.url).pathname)) return null;
        } catch {
          // Unparseable URL — let the event through rather than lose data.
        }
        return event;
      }}
    />
  );
}
