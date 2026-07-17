"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";

type IntlNumberOption = {
  number: string;
  region: string | null;
  city: string | null;
  // Present only on admin surfaces: when this number was last released from
  // an active line back to inventory.
  releasedAt?: string | null;
};

// New international add-on numbers (US/CA/UK) are picked here, not entered —
// BitLink owns a fixed inventory (international_dids table), so this shows a
// small live sample and lets the customer choose one. Ported foreign numbers
// never render this; only the "new number" flavor of the add-on does.

function formatE164(number: string, country: "us" | "canada" | "uk") {
  const digits = number.replace(/\D/g, "");
  if (country === "uk") {
    // +44 7520 654104
    const local = digits.slice(2);
    return `+44 ${local.slice(0, 4)} ${local.slice(4)}`;
  }
  // US/Canada: +1 (647) 493-9755
  const local = digits.slice(1);
  return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

export function IntlNumberPicker({
  endpoint,
  country,
  label,
  onChosen,
}: {
  // Full URL to GET number options from — differs per surface (payment link
  // is token-scoped, admin builder and account add-line are session-scoped).
  endpoint: string;
  country: "us" | "canada" | "uk";
  label: string;
  onChosen: (number: string | null) => void;
}) {
  const [options, setOptions] = useState<IntlNumberOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOptions() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint);
      const payload = (await response.json()) as { numbers?: IntlNumberOption[]; error?: string };
      if (!response.ok || !payload.numbers) {
        setError(payload.error ?? "Could not load numbers.");
        return;
      }
      setOptions(payload.numbers);
    } catch {
      setError("Could not load numbers. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Fetch-on-mount-and-on-country-change; loadOptions resets loading/error
    // before the request, same as the refresh button below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  function choose(number: string) {
    setSelected(number);
    onChosen(number);
  }

  function refresh() {
    setSelected(null);
    onChosen(null);
    loadOptions();
  }

  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium text-ink">{label}</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-slate">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Loading available numbers…
        </div>
      ) : error ? (
        <p className="text-xs font-semibold text-rose-700">{error}</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option) => {
            const isSelected = selected === option.number;
            return (
              <button
                key={option.number}
                type="button"
                onClick={() => choose(option.number)}
                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  isSelected
                    ? "border-link-blue bg-link-blue/10 font-semibold text-ink"
                    : "border-ink/15 bg-white text-ink hover:border-link-blue/40"
                }`}
              >
                <span>
                  {formatE164(option.number, country)}
                  {option.city ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-slate">
                      {option.city}{option.region ? `, ${option.region}` : ""}
                    </span>
                  ) : null}
                  {option.releasedAt ? (
                    <span className="mt-0.5 block text-[0.65rem] font-normal text-amber-700">
                      Returned {new Date(option.releasedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — previously in use
                    </span>
                  ) : null}
                </span>
                {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-link-blue" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}

      {!loading && !error ? (
        <button
          type="button"
          onClick={refresh}
          className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-slate transition hover:text-ink"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Show different options
        </button>
      ) : null}

      {!selected ? (
        <p className="text-xs font-semibold text-amber-800">Choose a number before payment.</p>
      ) : null}
    </div>
  );
}
