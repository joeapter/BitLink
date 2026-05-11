import type { Metadata } from "next";
import { createAdminSupportTicketAction } from "@/lib/admin/actions";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { getAdminDb } from "@/lib/db/admin";

export const metadata: Metadata = {
  title: "Admin Support",
};

export default async function AdminSupportPage() {
  const db = await getAdminDb();
  const tickets = db
    ? (await db.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(100)).data ?? []
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
      <section>
        <p className="text-sm font-semibold text-link-blue">Support</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-normal text-ink">Ticket queue</h1>
        <div className="mt-6 rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
          {tickets.length ? (
            <div className="grid gap-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-ink">{ticket.subject}</h2>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-slate">{ticket.message}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{ticket.priority}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No support tickets yet" />
          )}
        </div>
      </section>

      <form action={createAdminSupportTicketAction} className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
        <h2 className="text-xl font-semibold text-ink">Create ticket</h2>
        <div className="mt-5 grid gap-4">
          <Input label="Subject" name="subject" required />
          <Select label="Priority" name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </Select>
          <Textarea label="Message" name="message" required />
          <Button type="submit">Create ticket</Button>
        </div>
      </form>
    </div>
  );
}
