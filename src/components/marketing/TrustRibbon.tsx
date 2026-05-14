import { CreditCard, Headphones, ReceiptText, Wifi } from "lucide-react";

const items = [
  {
    icon: ReceiptText,
    title: "Transparent monthly pricing",
    body: "Clear recurring plan pricing before checkout.",
  },
  {
    icon: Headphones,
    title: "Human support",
    body: "A real team helps with activation and account questions.",
  },
  {
    icon: CreditCard,
    title: "Secure checkout",
    body: "Pay through a protected checkout with clear monthly plan details.",
  },
  {
    icon: Wifi,
    title: "Simple activation",
    body: "BitLink guides the setup and keeps your account status clear.",
  },
];

export function TrustRibbon() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-ink/10 bg-slate-50/80 p-4 shadow-soft">
          <div className="grid gap-3 md:grid-cols-4">
            {items.map((item) => (
              <div key={item.title} className="rounded-[1.5rem] bg-white p-5">
                <item.icon className="h-5 w-5 text-link-blue" aria-hidden="true" />
                <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-slate">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
