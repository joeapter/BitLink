import { Plus } from "lucide-react";
import { usCanadaNumberAddOn } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export function AddOnCard() {
  const addon = usCanadaNumberAddOn;

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-lg border border-ink/10 bg-white px-6 py-5 shadow-soft sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-link-blue/10">
          <Plus className="h-4 w-4 text-link-blue" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{addon.tagline}</p>
          <p className="mt-1 text-sm leading-6 text-muted-slate">{addon.body}</p>
        </div>
      </div>
      <div className="shrink-0 pl-11 sm:pl-0">
        <span className="text-xl font-semibold text-ink">
          +{formatMoney(addon.priceCents, addon.currency)}
          <span className="text-sm font-medium text-muted-slate">/mo</span>
        </span>
      </div>
    </div>
  );
}
