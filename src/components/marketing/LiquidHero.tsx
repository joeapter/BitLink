"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Headphones,
  RadioTower,
  Smartphone,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const proofPoints = [
  {
    title: "Keep your number",
    body: "Transfer in minutes.",
    icon: Smartphone,
  },
  {
    title: "Instant eSIM setup",
    body: "Activate directly from your phone.",
    icon: RadioTower,
  },
  {
    title: "Real support",
    body: "Talk to actual people when you need help.",
    icon: Headphones,
  },
  {
    title: "Simple monthly pricing",
    body: "No telecom maze. No hidden nonsense.",
    icon: CreditCard,
  },
];

export function LiquidHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="cinematic-hero relative isolate -mt-20 min-h-svh overflow-hidden bg-[#f7fafc] pt-20 text-ink">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/bitlink-telecom-hero-v2.png"
          alt=""
          aria-hidden="true"
          fill
          preload
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_34%,rgba(255,255,255,0.38)_63%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,252,0.22)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.9)_100%)]" />
        <div className="hero-light-sweep absolute inset-x-0 bottom-0 h-1/2" />
        <div className="hero-particles absolute inset-0 opacity-70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-5xl"
        >
          <p className="mb-6 inline-flex rounded-full border border-ink/10 bg-white/72 px-4 py-2 text-sm font-semibold text-link-blue shadow-sm backdrop-blur-xl">
            Israeli telecom, reimagined.
          </p>
          <h1 className="max-w-[64rem] text-balance text-[2.85rem] font-semibold leading-[0.98] tracking-normal text-ink sm:text-[3.55rem] lg:text-[5.4rem]">
            Israeli phone
            <br />
            service made
            <br />
            simple.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 sm:text-xl">
            Simple plans, instant eSIM activation, and real human support whenever you need help.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/plans" size="lg">
              Choose your plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/support" variant="secondary" size="lg">
              Talk to support
            </ButtonLink>
          </div>

          <div className="hero-trust-panel mt-10 max-w-4xl rounded-lg p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {proofPoints.map((item) => (
                <div key={item.title} className="hero-trust-item rounded-md px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0 text-link-blue" aria-hidden="true" />
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600">
            {["No telecom maze", "Online account access", "Setup guidance included"].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-trust-green" aria-hidden="true" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
