import { CreditCard, Headphones, ReceiptText, ShieldCheck } from "lucide-react";

const items = [
  {
    icon: ReceiptText,
    title: "Transparent monthly pricing",
    body: "Clear recurring plan pricing before checkout.",
  },
  {
    icon: Headphones,
    title: "Real people, real answers",
    body: "A human team helps with activation, billing, and account questions.",
  },
  {
    icon: CreditCard,
    title: "Secure checkout",
    body: "Pay through a protected checkout with clear monthly plan details.",
  },
  {
    icon: ShieldCheck,
    title: "Account visibility",
    body: "Your account keeps plan, setup, referral, and support status in one place.",
  },
];

export function TrustRibbon() {
  return (
    <section className="bg-white py-16 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold text-link-blue">Trust, made concrete</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-normal text-ink sm:text-5xl">
            Proof over promises.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-slate sm:text-lg sm:leading-8">
            BitLink keeps the phone plan experience clear before checkout and visible after signup.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} className="rounded-lg border border-ink/10 bg-[#f8fbfc] p-5 shadow-sm">
              <item.icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
