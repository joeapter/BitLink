import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrandMark } from "@/components/brand/BrandMark";
import { CustomOrderPayClient } from "@/components/checkout/CustomOrderPayClient";
import { normalizeCustomOrderLines } from "@/lib/stripe/custom-orders";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "BitLink Payment Link" };
export const dynamic = "force-dynamic";

export default async function CustomOrderPayPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  if (!admin) notFound();

  const { data: order } = await admin
    .from("custom_line_orders")
    .select("token, status, lines, customers(full_name, email)")
    .eq("token", token)
    .maybeSingle();

  if (!order) notFound();

  const customer = order.customers as { full_name?: string | null; email?: string | null } | null;
  const lines = normalizeCustomOrderLines(order.lines);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <BrandMark />
        </div>
        <CustomOrderPayClient
          token={order.token as string}
          status={order.status as string}
          customerName={(customer?.full_name ?? null) as string | null}
          customerEmail={(customer?.email ?? null) as string | null}
          lines={lines}
        />
      </div>
    </main>
  );
}
