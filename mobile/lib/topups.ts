import { supabase } from "./supabase";
import { SITE_URL } from "./theme";

// Top-up catalogue for the native Top-ups tab.
//
// Mirrors src/lib/topups.ts exactly, including both variants of the USA/CA
// minutes bundle. They are the same Annatel plan; Annatel's catalogue just
// labels one "kosher", and the web keeps them as separate entries so anything
// filtering on forKosher can never mix them up.
//
// forKosher must mirror the web exactly, because getTopUpsForPlan() shows a
// line only the entries where forKosher === line.is_kosher, and grantTopup()
// rejects a mismatch outright. Get it wrong in either direction and the app
// either hides a bundle the customer can buy or offers one that always fails.
//
// (A comment in src/lib/topups.ts calls usa-ca-120min-standard admin-only.
// That is stale: getTopUpsForPlan(false) returns it and TopupCard renders it,
// so non-kosher customers can and do buy it self-serve on the website.)

export type NativeTopUp = {
  id: string;
  name: string;
  description: string;
  price: string;
  forKosher: boolean;
  badge?: string;
};

export const topups: NativeTopUp[] = [
  {
    id: "data-5gb",
    name: "+5GB Data",
    description: "High-speed 5G data, valid 30 days.",
    price: "$5.99",
    forKosher: false,
  },
  {
    id: "data-10gb",
    name: "+10GB Data",
    description: "High-speed 5G data, valid 30 days.",
    price: "$9.99",
    forKosher: false,
  },
  {
    id: "data-20gb",
    name: "+20GB Data",
    description: "High-speed 5G data, valid 30 days.",
    price: "$17.99",
    forKosher: false,
    badge: "Best value",
  },
  {
    id: "data-50gb",
    name: "+50GB Data",
    description: "High-speed 5G data, valid 30 days.",
    price: "$34.99",
    forKosher: false,
  },
  {
    id: "usa-ca-120min",
    name: "+120 Min USA/CA",
    description: "Calling to US and Canadian numbers, valid 30 days.",
    price: "$14.99",
    forKosher: true,
  },
  {
    // Same bundle and same price for a non-kosher line; a separate id because
    // the carrier catalogue separates them.
    id: "usa-ca-120min-standard",
    name: "+120 Min USA/CA",
    description: "Calling to US and Canadian numbers, valid 30 days.",
    price: "$14.99",
    forKosher: false,
  },
  {
    id: "local-1000min",
    name: "+1,000 Local Min",
    description: "Minutes to Israeli numbers, valid 30 days.",
    price: "$9.99",
    forKosher: true,
  },
];

export function topupsForLine(isKosher: boolean): NativeTopUp[] {
  return topups.filter((t) => t.forKosher === isKosher);
}

export function findTopup(id: string): NativeTopUp | undefined {
  return topups.find((t) => t.id === id);
}


/**
 * Buy a top-up. Charges the customer's saved card through /api/app/topups,
 * which reuses the same grantTopup() the website and admin console use — so
 * every eligibility rule lives in one place on the server, not here.
 *
 * Apple permits charging directly for this: mobile data on a real SIM is a
 * service consumed outside the app (guideline 3.1.3(e)), which must NOT use
 * in-app purchase.
 */
export async function buyTopup(lineId: string, topupId: string): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in again.");

  const response = await fetch(`${SITE_URL}/api/app/topups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lineId, topupId }),
  });

  // The route answers with JSON for both outcomes; anything else (a proxy
  // error page, say) should still surface as a readable message rather than a
  // JSON parse crash.
  const payload = (await response.json().catch(() => null)) as
    | { success?: string; error?: string }
    | null;

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error ?? "That didn't go through. Please try again.");
  }
  return payload?.success ?? "Top-up added.";
}
