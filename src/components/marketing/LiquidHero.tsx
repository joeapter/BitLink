"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { ConnectionOrb } from "@/components/brand/ConnectionOrb";
import { ButtonLink } from "@/components/ui/Button";

export function LiquidHero() {
  return (
    <section className="liquid-bg relative isolate overflow-hidden bg-ink text-white">
      <div className="noise-overlay absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="mb-5 inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-semibold text-cyan-100 backdrop-blur">
            BitLink Telecom
          </p>
          <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
            Mobile plans that feel effortless.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
            BitLink gives you simple monthly connectivity, clean billing, and human support — all wrapped in a smoother way to stay connected.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/plans" variant="dark" size="lg">
              Choose your plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="secondary" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/16">
              See how BitLink works
            </ButtonLink>
          </div>

          <div className="mt-8 grid gap-3 text-sm text-slate-200 sm:grid-cols-3">
            {[
              ["Secure checkout", ShieldCheck],
              ["Human support", CheckCircle2],
              ["Smooth activation", Sparkles],
            ].map(([label, Icon]) => (
              <div key={label as string} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-soft-cyan" aria-hidden="true" />
                <span>{label as string}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: "easeOut" }}
          className="pb-8 md:pb-0"
        >
          <ConnectionOrb />
        </motion.div>
      </div>
    </section>
  );
}
