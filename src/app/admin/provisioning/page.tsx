import type { Metadata } from "next";
import { ProvisioningQueue } from "@/components/admin/ProvisioningQueue";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Provisioning",
};

export default async function AdminProvisioningPage() {
  const db = await getAdminDb();
  const orders = db
    ? (
        await db
          .from("orders")
          .select("*")
          .not("provisioning_status", "in", "(active,cancelled)")
          .order("created_at", { ascending: true })
          .limit(100)
      ).data ?? []
    : [];

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-sm font-semibold text-link-blue">Provisioning</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Manual activation workflow</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-slate">
          MVP statuses: new order, payment confirmed, awaiting SIM assignment, SIM assigned, activation sent, active, suspended, cancelled.
        </p>
      </section>
      <ProvisioningQueue orders={orders} />
    </div>
  );
}
