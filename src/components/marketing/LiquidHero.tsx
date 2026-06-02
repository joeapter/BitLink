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
    <section className="cinematic-hero relative isolate -mt-20 min-h-[660px] overflow-hidden bg-[#f7fafc] pt-20 text-ink sm:min-h-svh">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/bitlink-telecom-hero-v2.png"
          alt=""
          aria-hidden="true"
          fill
          preload
          quality={90}
          sizes="100vw"
          className="object-cover object-[57%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_50%,rgba(255,255,255,0.58)_100%)] sm:bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_34%,rgba(255,255,255,0.38)_63%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,252,0.18)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.66)_100%)] sm:bg-[linear-gradient(180deg,rgba(247,250,252,0.22)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.9)_100%)]" />
        <div className="hero-light-sweep absolute inset-x-0 bottom-0 h-1/2" />
        <div className="hero-particles absolute inset-0 opacity-70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[580px] max-w-7xl items-start px-4 py-12 sm:min-h-[calc(100svh-5rem)] sm:items-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-5xl"
        >
          <p className="mb-5 text-sm font-semibold text-link-blue sm:mb-6">
            Israeli telecom, reimagined.
          </p>
          <h1 className="max-w-[64rem] text-balance text-[2.72rem] font-semibold leading-[0.98] tracking-normal text-ink sm:text-[3.55rem] lg:text-[5.4rem]">
            Israeli phone
            <br />
            service made
            <br />
            simple.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:mt-6 sm:text-xl sm:leading-8">
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

          <div className="hero-trust-panel mt-8 max-w-4xl rounded-lg p-3 sm:mt-10 sm:p-5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {proofPoints.map((item) => (
                <div key={item.title} className="hero-trust-item rounded-md px-2.5 py-3 sm:px-3">
                  <div className="flex items-start gap-2.5 sm:items-center">
                    <item.icon className="h-4 w-4 shrink-0 text-link-blue" aria-hidden="true" />
                    <p className="text-xs font-semibold leading-5 text-ink sm:text-sm sm:leading-normal">{item.title}</p>
                  </div>
                  <p className="mt-2 text-[0.72rem] leading-5 text-slate-600 sm:text-xs">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-slate-600 sm:mt-8">
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
