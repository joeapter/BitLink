import Image from "next/image";
import { ArrowRight, Mail, MessageCircle, PhoneCall } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

const supportMoments = [
  {
    icon: MessageCircle,
    label: "Before it gets confusing",
    body: "Get a clear answer before telecom starts feeling complicated.",
  },
  {
    icon: Mail,
    label: "Choosing without guessing",
    body: "Talk through what actually fits your stay, family, or usage.",
  },
  {
    icon: PhoneCall,
    label: "Setup made clear",
    body: "Get simple guidance from a real person when you're ready to activate.",
  },
];

export function HumanSupportSection() {
  return (
    <section
      id="support-promise"
      className="human-support-shell relative isolate overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fbfc_50%,#ffffff_100%)] py-16 sm:py-32 lg:min-h-[820px] lg:bg-white"
    >
      <Image
        src="/assets/bitlink-human-support-v3.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="support-scene-image absolute inset-0 -z-20 hidden object-cover object-[64%_center] lg:block"
      />
      <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.95)_32%,rgba(255,255,255,0.62)_54%,rgba(255,255,255,0.06)_100%)] lg:block" />
      <div className="absolute inset-0 -z-10 hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.07)_34%,rgba(255,255,255,0.92)_100%)] lg:block" />
      <div className="support-warmth absolute inset-0 -z-10 hidden lg:block" />
      <div className="support-ambient absolute inset-x-0 top-20 -z-10 hidden h-24 opacity-45 lg:block" />
      <div className="pointer-events-none absolute right-[6%] top-[20%] z-0 hidden w-[24rem] rounded-lg bg-ink/78 p-5 text-white shadow-[0_22px_70px_rgba(7,20,40,0.2)] backdrop-blur-2xl lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/66">Ari</p>
        <p className="mt-2 text-sm leading-6 text-white/92">
          Hey, I think I need more data. What&apos;s the easiest plan to switch to?
        </p>
      </div>
      <div className="pointer-events-none absolute right-[16%] top-[42%] z-0 hidden w-[21rem] rounded-lg bg-white/84 p-5 text-ink shadow-[0_20px_60px_rgba(7,20,40,0.14)] ring-1 ring-white/70 backdrop-blur-2xl lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-link-blue">Joe</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Absolutely. Let me take a look and I&apos;ll point you to the simplest option.
        </p>
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl items-start px-4 sm:px-6 lg:min-h-[calc(820px-16rem)] lg:items-center lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-link-blue">Support that actually feels supportive.</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.03] tracking-normal text-ink sm:text-5xl lg:text-6xl">
            Real people,
            <br />
            real answers.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-slate sm:mt-6 sm:text-lg sm:leading-8">
            Moving to Israel is complicated enough. Your phone service shouldn&apos;t be. When you need help,
            you should feel like someone real is actually there.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-5">
            <ButtonLink href="/support" size="lg" className="h-14 px-7">
              Talk to support
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/plans" variant="secondary" size="lg" className="h-14 px-7">
              View simple plans
            </ButtonLink>
          </div>

          <div
            className="relative mt-9 overflow-hidden rounded-lg border border-ink/10 bg-[#eef7f9] shadow-soft lg:hidden"
            aria-hidden="true"
          >
            <div className="relative min-h-[19rem]">
              <Image
                src="/assets/bitlink-human-support-v3.png"
                alt=""
                fill
                sizes="(max-width: 1023px) 100vw, 1px"
                className="support-scene-image object-cover object-[62%_center]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.2)_44%,rgba(255,255,255,0.72)_100%)]" />
              <div className="absolute left-4 top-4 max-w-[14.5rem] rounded-lg bg-ink/82 p-4 text-white shadow-[0_18px_48px_rgba(7,20,40,0.24)] backdrop-blur-2xl">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/66">Ari</p>
                <p className="mt-2 text-xs leading-5 text-white/92">
                  I think I need more data. What&apos;s the simplest option?
                </p>
              </div>
              <div className="absolute bottom-4 right-4 max-w-[13.5rem] rounded-lg bg-white/88 p-4 text-ink shadow-[0_16px_42px_rgba(7,20,40,0.16)] ring-1 ring-white/70 backdrop-blur-2xl">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-link-blue">Joe</p>
                <p className="mt-2 text-xs leading-5 text-slate-700">
                  I&apos;ll point you to the clearest fit.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-xl text-sm font-semibold text-ink">
            No bot maze. Just a clearer path to someone who can actually help.
          </p>

          <div className="mt-8 max-w-2xl divide-y divide-ink/8 border-y border-ink/8 sm:mt-10">
            {supportMoments.map((moment) => (
              <div key={moment.label} className="grid grid-cols-[2.75rem_1fr] gap-4 py-5">
                <div className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-[#e6fbff] text-link-blue ring-1 ring-link-blue/15">
                  <moment.icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">{moment.label}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-slate">{moment.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
