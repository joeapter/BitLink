// Live USD→ILS exchange rate for the org profit report.
//
// Uses open.er-api.com — a free, no-API-key endpoint (run by exchangerate-api)
// that updates daily and returns ILS among its rates. Cached via Next's fetch
// cache so we call it at most a couple of times a day, and falls back to a
// sane constant if it's ever unreachable so the report never breaks.

const FALLBACK_USD_ILS = 3.7;

export type UsdIlsRate = {
  rate: number;
  source: "live" | "fallback";
  asOf: string | null;
};

export async function getUsdToIlsRate(): Promise<UsdIlsRate> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      // Refresh at most twice a day — FX moves slowly and the source updates daily.
      next: { revalidate: 60 * 60 * 12 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      result?: string;
      time_last_update_utc?: string;
      rates?: Record<string, number>;
    };
    const ils = data?.rates?.ILS;
    if (data?.result === "success" && typeof ils === "number" && ils > 0) {
      return { rate: ils, source: "live", asOf: data.time_last_update_utc ?? null };
    }
    throw new Error("no ILS rate in response");
  } catch {
    return { rate: FALLBACK_USD_ILS, source: "fallback", asOf: null };
  }
}
