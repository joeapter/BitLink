import { notFound } from "next/navigation";
import Image from "next/image";
import { plans } from "@/lib/plans";
import { contractData } from "@/lib/contracts";
import { PrintButton } from "./PrintButton";

export function generateStaticParams() {
  return plans.map((plan) => ({ slug: plan.slug }));
}

export default async function PlanContractPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plan = plans.find((p) => p.slug === slug);
  if (!plan) notFound();
  const contract = contractData[plan.slug];
  if (!contract) notFound();

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 2cm; }
        }
      `}</style>

      <div className="no-print fixed right-6 top-6 z-50 flex gap-3">
        <PrintButton />
        <a href={`/plans/${plan.slug}`} className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink shadow-sm hover:bg-slate-50">
          ← Back to plan
        </a>
      </div>

      <div className="mx-auto max-w-3xl px-8 py-12 font-sans text-sm text-slate-800">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <Image src="/assets/logo-v2.png" alt="BitLink" width={130} height={39} className="h-9 w-auto" />
          <div className="text-right">
            <p className="text-xs text-slate-500">Service Agreement</p>
            <p className="text-xs text-slate-500">{today}</p>
          </div>
        </div>

        <h1 className="mb-1 text-2xl font-bold text-ink">Plan: {plan.name}</h1>
        <p className="mb-8 text-slate-500">BitLink Telecom Services</p>

        {/* Customer fields */}
        <table className="mb-8 w-full border border-slate-200 text-sm">
          <tbody>
            {[
              ["Date", ""],
              ["Customer name", ""],
              ["Address", ""],
              ["Email", ""],
              ["Phone number assigned", ""],
            ].map(([label]) => (
              <tr key={label} className="border-b border-slate-100">
                <td className="w-48 bg-slate-50 px-4 py-2 font-semibold">{label}</td>
                <td className="px-4 py-2 text-slate-300">. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Periods */}
        <Section title="Periods">
          <Row label="Activation time" value={contract.activationTime} />
          <Row label="Commitment" value={contract.commitment} />
        </Section>

        {/* Payments */}
        <Section title="Monthly Payment">
          <Row label="Monthly price" value={contract.monthlyAlone} />
        </Section>

        <Section title="One-Time Fees">
          <Row label="SIM / Activation" value={contract.simFee} />
        </Section>

        {/* Included */}
        <Section title="Included in the Plan">
          <tr className="border-b border-slate-100">
            <td className="w-36 bg-slate-50 px-4 py-3 align-top font-semibold">From Israel</td>
            <td className="px-4 py-3">
              <p className="font-semibold">Calls</p>
              <p className="mt-0.5">{contract.includedFromIsrael.calls}</p>
              {contract.includedFromIsrael.sms ? (
                <>
                  <p className="mt-2 font-semibold">SMS</p>
                  <p className="mt-0.5">{contract.includedFromIsrael.sms}</p>
                </>
              ) : (
                <p className="mt-1 text-slate-400">SMS — Not included</p>
              )}
              {contract.includedFromIsrael.data ? (
                <>
                  <p className="mt-2 font-semibold">Mobile Data</p>
                  <p className="mt-0.5">{contract.includedFromIsrael.data}</p>
                </>
              ) : (
                <p className="mt-1 text-slate-400">Mobile data — Not included</p>
              )}
            </td>
          </tr>
          {contract.otherServices.length > 0 && (
            <tr>
              <td className="w-36 bg-slate-50 px-4 py-3 align-top font-semibold">Other services</td>
              <td className="px-4 py-3">
                <ul className="list-disc pl-4">
                  {contract.otherServices.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </td>
            </tr>
          )}
        </Section>

        {/* Not included */}
        <Section title="Not Included in the Plan">
          {contract.notIncluded.map((row) => (
            <Row key={row.item} label={row.item} value={row.rate} />
          ))}
        </Section>

        {/* Notes */}
        <div className="mb-8">
          <h2 className="mb-3 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-600">Notes</h2>
          <ol className="list-decimal pl-5 leading-7">
            {contract.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ol>
        </div>

        {/* Signatures */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="mb-6 text-slate-500">
            By signing below, I confirm that I have read and fully accept these conditions and the general terms and conditions of BitLink Telecom Services.
          </p>
          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="mb-6 font-semibold">Signature of customer</p>
              <div className="border-b border-slate-300 pb-8" />
              <p className="mt-2 text-xs text-slate-400">Date: . . . . . . . . . . . . . . . . . . . .</p>
            </div>
            <div>
              <p className="mb-6 font-semibold">BitLink representative</p>
              <div className="border-b border-slate-300 pb-8" />
              <p className="mt-2 text-xs text-slate-400">Date: . . . . . . . . . . . . . . . . . . . .</p>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-slate-400">
          BitLink Telecom · bitlink.co.il · support@bitlink.co.il
        </p>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-bold uppercase tracking-wide text-slate-600">{title}</h2>
      <table className="w-full border border-slate-200">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="w-64 bg-slate-50 px-4 py-2 font-semibold">{label}</td>
      <td className="px-4 py-2">{value}</td>
    </tr>
  );
}
