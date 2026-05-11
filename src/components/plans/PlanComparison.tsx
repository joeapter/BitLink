import { plans } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";

export function PlanComparison() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left">
          <thead className="bg-slate-50 text-sm text-slate-500">
            <tr>
              <th className="px-5 py-4 font-semibold">Plan</th>
              <th className="px-5 py-4 font-semibold">Monthly</th>
              <th className="px-5 py-4 font-semibold">Data posture</th>
              <th className="px-5 py-4 font-semibold">International</th>
              <th className="px-5 py-4 font-semibold">Activation</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {plans.map((plan) => (
              <tr key={plan.slug} className="text-sm text-slate-700">
                <td className="px-5 py-5">
                  <div className="font-semibold text-ink">{plan.name}</div>
                  <div className="mt-1 max-w-xs text-xs leading-5 text-muted-slate">{plan.description}</div>
                </td>
                <td className="px-5 py-5 font-semibold text-ink">{formatMoney(plan.priceCents, plan.currency)}/mo</td>
                <td className="px-5 py-5">{plan.comparison.data}</td>
                <td className="px-5 py-5">{plan.comparison.international}</td>
                <td className="px-5 py-5">{plan.comparison.activation}</td>
                <td className="px-5 py-5">
                  <ButtonLink href={`/checkout?plan=${plan.slug}`} size="sm" variant={plan.featured ? "primary" : "secondary"}>
                    Choose
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
