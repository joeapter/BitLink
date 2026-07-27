import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Truck, Mail } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { getPlan } from "@/lib/plans";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Delivery Slip" };

export default async function DeliverySlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getAdminDb();
  if (!db) notFound();

  const { data: delivery } = await db.from("physical_sim_deliveries").select("*").eq("id", id).maybeSingle();
  if (!delivery) notFound();

  const { data: line } = await db
    .from("telecom_lines")
    .select("id, customer_id, metadata")
    .eq("id", delivery.telecom_line_id)
    .maybeSingle();

  const { data: customer } = line?.customer_id
    ? await db.from("customers").select("full_name, email, phone").eq("id", line.customer_id).maybeSingle()
    : { data: null };

  const meta = (line?.metadata as Record<string, unknown> | null) ?? {};
  const planSlug = (meta.plan_slug as string | undefined) ?? null;
  const planName = planSlug ? getPlan(planSlug).name : "—";
  const orderRef = delivery.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm font-semibold text-muted-slate">Delivery slip preview — use Print to hand to the courier.</p>
        <PrintButton label="Print delivery slip" />
      </div>

      <div className="rounded-[2rem] border border-ink/10 bg-white p-8 shadow-soft print:rounded-none print:border-2 print:border-ink print:shadow-none">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <p className="text-2xl font-semibold tracking-normal text-ink">BitLink</p>
          <p className="text-sm font-semibold text-muted-slate">Delivery Slip</p>
        </div>

        <div className="mt-5 flex items-center gap-2">
          {delivery.method === "courier" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-trust-green/10 px-3 py-1.5 text-sm font-semibold text-trust-green">
              <Truck className="h-4 w-4" aria-hidden="true" /> Next-day courier
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-link-blue/10 px-3 py-1.5 text-sm font-semibold text-link-blue">
              <Mail className="h-4 w-4" aria-hidden="true" /> Israel Post
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Recipient</p>
            <p className="mt-1 text-lg font-semibold text-ink">{customer?.full_name ?? "—"}</p>
            <p className="text-sm text-slate-600">{customer?.phone ?? "—"}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Deliver to</p>
            <p className="mt-1 text-base text-ink">{delivery.address_line1}</p>
            {delivery.address_line2 ? <p className="text-base text-ink">{delivery.address_line2}</p> : null}
            <p className="text-base font-semibold text-ink">{delivery.city}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Plan</p>
              <p className="mt-1 text-sm text-ink">{planName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Requested date</p>
              <p className="mt-1 text-sm text-ink">
                {delivery.requested_date ? new Date(delivery.requested_date as string).toLocaleDateString("en-GB") : "As soon as possible"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-slate">Order reference</p>
            <p className="mt-1 font-mono text-sm text-ink">{orderRef}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6 border-t border-ink/10 pt-6 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-muted-slate">Received by</p>
            <div className="mt-6 border-b border-ink/20" />
          </div>
          <div>
            <p className="font-semibold text-muted-slate">Date</p>
            <div className="mt-6 border-b border-ink/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
