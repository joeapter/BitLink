"use client";

import Image from "next/image";

// Temporary: same hero treatment as LiquidHero, but pointed at the original
// uncompressed PNG so it can be compared against the live JPEG in another tab.
// Safe to delete this whole route once the comparison is done.
export function TempHeroPngTest() {
  return (
    <section className="cinematic-hero relative isolate min-h-[660px] overflow-hidden bg-[#f7fafc] pt-20 text-ink sm:min-h-svh">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/bitlink-telecom-hero-v2-png-test.png"
          alt=""
          aria-hidden="true"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[57%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.9)_50%,rgba(255,255,255,0.58)_100%)] sm:bg-[linear-gradient(90deg,rgba(255,255,255,0.96)_0%,rgba(255,255,255,0.86)_34%,rgba(255,255,255,0.38)_63%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,250,252,0.18)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.66)_100%)] sm:bg-[linear-gradient(180deg,rgba(247,250,252,0.22)_0%,rgba(255,255,255,0)_42%,rgba(255,255,255,0.9)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[580px] max-w-7xl items-start px-4 py-12 sm:min-h-[calc(100svh-5rem)] sm:items-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="w-full max-w-5xl">
          <p className="mb-5 text-sm font-semibold text-link-blue sm:mb-6">
            TEMP TEST PAGE — original PNG source, delete after comparing
          </p>
          <h1 className="max-w-[64rem] text-balance text-[2.72rem] font-semibold leading-[0.98] tracking-normal text-ink sm:text-[3.55rem] lg:text-[5.4rem]">
            Israeli phone
            <br />
            service made
            <br />
            simple.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:mt-6 sm:text-xl sm:leading-8">
            This is the original PNG hero image, rendered with the same treatment as the live homepage, for side-by-side comparison only.
          </p>
        </div>
      </div>
    </section>
  );
}
