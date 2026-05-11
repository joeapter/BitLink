import type { Metadata } from "next";

const labels: Record<string, string> = {
  terms: "Terms",
  privacy: "Privacy",
  "acceptable-use": "Acceptable Use",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: labels[slug] ?? "Legal" };
}

export default async function LegalPlaceholderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = labels[slug] ?? "Legal";

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-link-blue">BitLink legal</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-normal text-ink">{title}</h1>
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-slate-50 p-6 text-sm leading-7 text-muted-slate">
          <p>
            TODO: Replace this placeholder with production-ready {title.toLowerCase()} language reviewed for the operating market, telecom obligations, billing, support, acceptable use, privacy, and data retention.
          </p>
          <p className="mt-4">
            Current MVP copy intentionally avoids unverified telecom guarantees. Activation and service availability should be confirmed by the BitLink team.
          </p>
        </div>
      </div>
    </section>
  );
}
