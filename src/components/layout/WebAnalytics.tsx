"use client";

import { Analytics } from "@vercel/analytics/next";

// Drop internal surfaces from Vercel Web Analytics so traffic numbers reflect
// visitors, not our own admin/portal sessions. GA4 gets the same exclusion via
// the ga-disable flag in app/layout.tsx; both cover client-side navigations
// into and out of these routes, not just the landing path.
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
