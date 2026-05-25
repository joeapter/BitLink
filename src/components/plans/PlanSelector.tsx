"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PhoneCall } from "lucide-react";
import { useMemo, useState } from "react";
import { plans, type PlanSlug } from "@/lib/plans";
import { formatMoney, cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { PlanFeatureList } from "./PlanFeatureList";

export function PlanSelector({ initialSlug = "israel-plus" }: { initialSlug?: PlanSlug }) {
  const [selectedSlug, setSelectedSlug] = useState<PlanSlug>(initialSlug);
  const reduceMotion = useReducedMotion();
  const selected = useMemo(
    () => plans.find((plan) => plan.slug === selectedSlug) ?? plans[1],
    [selectedSlug],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[21rem_minmax(0,1fr)]">
      <div className="rounded-lg border border-ink/10 bg-white p-2 shadow-soft">
        <div className="scrollbar-none flex gap-2 overflow-x-auto lg:grid lg:overflow-visible">
          {plans.map((plan) => {
            const active = plan.slug === selected.slug;
            return (
              <button
                key={plan.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSlug(plan.slug)}
                className={cn(
                  "min-w-[15.5rem] rounded-md border px-4 py-4 text-left transition lg:min-w-0",
                  active
                    ? "border-link-blue/40 bg-[#f4fdff] text-ink shadow-sm"
                    : "border-transparent text-slate-600 hover:border-ink/10 hover:bg-slate-50 hover:text-ink",
                )}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {plan.featured ? (
                    <span className="rounded-full bg-trust-green/10 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Popular
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 block text-2xl font-semibold">
                  {formatMoney(plan.priceCents, plan.currency)}
                  <span className="text-sm font-medium text-current/60">/mo</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-current/62">{plan.tone}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-ink/10 bg-white p-6 shadow-soft sm:p-8">
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-soft-cyan/20 blur-3xl" />
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.slug}
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
            className="relative"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3 py-1 text-sm font-semibold text-slate-600 shadow-sm">
              <PhoneCall className="h-4 w-4 text-link-blue" aria-hidden="true" />
              Checkout securely. We&apos;ll get your connection moving.
            </div>

            <div className="grid gap-8 xl:grid-cols-[1fr_18rem]">
              <div>
                <p className="text-sm font-semibold text-link-blue">{selected.tone}</p>
                <h2 className="mt-2 text-balance text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
                  {selected.name}
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-slate">{selected.description}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{selected.detail}</p>
                {selected.longDistance ? (
                  <p className="mt-4 inline-flex rounded-full bg-trust-green/10 px-4 py-2 text-sm font-semibold text-emerald-700">
                    Long-distance allowance: {selected.longDistance}
                  </p>
                ) : null}
              </div>

              <div className="border-t border-ink/10 pt-6 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
                <div className="text-4xl font-semibold text-ink">
                  {formatMoney(selected.priceCents, selected.currency)}
                  <span className="text-base font-medium text-muted-slate">/mo</span>
                </div>
                <div className="mt-5">
                  <PlanFeatureList plan={selected} />
                </div>
                <div className="mt-6 grid gap-2">
                  <ButtonLink href={`/checkout?plan=${selected.slug}`} className="w-full">
                    Choose {selected.shortName}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </ButtonLink>
                  <ButtonLink href={`/plans/${selected.slug}`} variant="secondary" className="w-full">
                    Plan details
                  </ButtonLink>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
