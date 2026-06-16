"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PhoneCall } from "lucide-react";
import { useMemo, useState } from "react";
import { plans, type PlanSlug } from "@/lib/plans";
import { formatMoney, cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { PlanFeatureList } from "./PlanFeatureList";

type Tab = "plans" | "kosher";

const TAB_DEFAULTS: Record<Tab, PlanSlug> = {
  plans: "student-5g",
  kosher: "unlimited-kosher",
};

export function PlanSelector({ initialSlug = "student-5g" }: { initialSlug?: PlanSlug }) {
  const initialTab: Tab = plans.find((p) => p.slug === initialSlug)?.isKosher ? "kosher" : "plans";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selectedSlug, setSelectedSlug] = useState<PlanSlug>(initialSlug);
  const reduceMotion = useReducedMotion();

  const visiblePlans = useMemo(() => plans.filter((p) => p.isKosher === (tab === "kosher")), [tab]);
  const selected = useMemo(
    () => visiblePlans.find((p) => p.slug === selectedSlug) ?? visiblePlans[0],
    [visiblePlans, selectedSlug],
  );

  function switchTab(next: Tab) {
    setTab(next);
    setSelectedSlug(TAB_DEFAULTS[next]);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-5">
      <div className="rounded-lg border border-ink/10 bg-white p-2 shadow-soft">
        {/* Tab switcher */}
        <div className="mb-2 flex gap-1 rounded-md bg-slate-100 p-1">
          {(["plans", "kosher"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={cn(
                "flex-1 rounded py-1.5 text-xs font-semibold transition",
                tab === t ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
              )}
            >
              {t === "plans" ? "Plans" : "Kosher Plans"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {visiblePlans.map((plan) => {
            const active = plan.slug === selected.slug;
            return (
              <button
                key={plan.slug}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedSlug(plan.slug as PlanSlug)}
                className={cn(
                  "min-w-0 rounded-md border px-3 py-3 text-left transition sm:px-4 sm:py-4",
                  active
                    ? "border-link-blue/40 bg-[#f4fdff] text-ink shadow-sm"
                    : "border-transparent text-slate-600 hover:border-ink/10 hover:bg-slate-50 hover:text-ink",
                )}
              >
                <span className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-sm font-semibold leading-5">{plan.name}</span>
                  {plan.badge ? (
                    <span className="rounded-full bg-trust-green/10 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-emerald-700 sm:text-[0.68rem] sm:tracking-[0.12em]">
                      {plan.badge}
                    </span>
                  ) : null}
                </span>
                <span className="mt-3 block text-xl font-semibold sm:text-2xl">
                  {formatMoney(plan.priceCents, plan.currency)}
                  <span className="text-sm font-medium text-current/60">/mo</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-current/62">{plan.tone}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-ink/10 bg-white p-5 shadow-soft sm:p-8">
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
            <div className="mb-5 flex max-w-full items-start gap-2 rounded-full border border-ink/10 bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600 shadow-sm sm:mb-6 sm:inline-flex sm:items-center sm:py-1 sm:text-sm sm:leading-normal">
              <PhoneCall className="h-4 w-4 text-link-blue" aria-hidden="true" />
              Checkout securely. We&apos;ll get your connection moving.
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-ink/10 pb-5 sm:pb-6">
              <div>
                <p className="text-sm font-semibold text-link-blue">{selected.tone}</p>
                <h2 className="mt-2 text-balance text-3xl font-semibold tracking-normal text-ink sm:text-4xl">
                  {selected.name}
                </h2>
              </div>
              <div className="shrink-0 text-3xl font-semibold text-ink sm:text-4xl">
                {formatMoney(selected.priceCents, selected.currency)}
                <span className="text-base font-medium text-muted-slate">/mo</span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">{selected.description}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selected.detail}</p>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_auto]">
              <PlanFeatureList plan={selected} />
              <div className="flex flex-col justify-end gap-2 sm:min-w-42">
                <ButtonLink href={`/checkout?plan=${selected.slug}`} className="w-full">
                  Choose {selected.shortName}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href={`/plans/${selected.slug}`} variant="secondary" className="w-full">
                  Plan details
                </ButtonLink>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
