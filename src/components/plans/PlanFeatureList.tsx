import { CheckCircle2 } from "lucide-react";
import type { BitLinkPlan } from "@/lib/plans";

export function PlanFeatureList({ plan }: { plan: BitLinkPlan }) {
  return (
    <ul className="grid gap-3">
      {plan.features.map((feature) => (
        <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-trust-green" aria-hidden="true" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}
