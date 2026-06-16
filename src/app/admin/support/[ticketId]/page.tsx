import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Phone, Mail, ExternalLink } from "lucide-react";
import { getAdminDb } from "@/lib/db/admin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { updateTicketStatusAction, updateTicketPriorityAction, addTicketNoteAction } from "@/lib/admin/support-actions";
import { MacroCard } from "@/components/admin/MacroCard";

export const metadata: Metadata = { title: "Support Ticket" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ ticketId: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  activation: "Activation", esim_activation: "eSIM activation",
  no_data: "No data", no_service_sos: "No service / SOS",
  porting: "Porting", billing: "Billing", change_plan: "Change plan",
  roaming_travel: "Roaming", lost_phone: "Lost phone", other: "Other",
};

const STATUSES = ["open", "waiting_on_customer", "waiting_on_provider", "resolved", "closed"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-700 bg-red-50 border-red-200",
  high:   "text-orange-700 bg-orange-50 border-orange-200",
  normal: "text-slate-600 bg-slate-100 border-slate-200",
  low:    "text-slate-400 bg-slate-50 border-slate-200",
};

export default async function AdminTicketDetailPage({ params }: Props) {
  const { ticketId } = await params;
  const db = await getAdminDb();
  if (!db) notFound();

  // Fetch ticket
  const { data: ticket } = await db.from("support_tickets").select("*").eq("id", ticketId).single();
  if (!ticket) notFound();

  // Fetch notes/messages
  const { data: messages } = await db
    .from("support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  // Fetch macros (category match first, then others)
  const { data: allMacros } = await db
    .from("support_macros")
    .select("*")
    .eq("active", true)
    .order("usage_count", { ascending: false });

  const categoryMacros = (allMacros ?? []).filter((m) => m.category === ticket.category);
  const otherMacros    = (allMacros ?? []).filter((m) => m.category !== ticket.category);

  // Customer context — try to match by email, phone, bitlink_phone
  let customer = null;
  let subscription = null;
  let telecomLine = null;

  if (ticket.email) {
    const { data } = await db.from("customers").select("*").eq("email", ticket.email).maybeSingle();
    if (data) customer = data;
  }
  if (!customer && ticket.whatsapp_number) {
    const { data } = await db.from("customers").select("*").eq("phone", ticket.whatsapp_number).maybeSingle();
    if (data) customer = data;
  }
  if (!customer && ticket.bitlink_phone) {
    const { data } = await db.from("customers").select("*").eq("phone", ticket.bitlink_phone).maybeSingle();
    if (data) customer = data;
  }

  if (customer) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("*, plans(name, slug)")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    subscription = sub;

    const { data: line } = await db
      .from("telecom_lines")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    telecomLine = line;
  }

  const waMessage = encodeURIComponent(
    `Hi ${ticket.customer_name ?? "there"} 👋 This is BitLink support following up on your ticket ${ticket.ticket_number}.`
  );
  const waUrl = `https://wa.me/${(ticket.whatsapp_number ?? "").replace(/[^0-9]/g, "")}?text=${waMessage}`;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/support" className="flex items-center gap-1 text-sm text-muted-slate hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>
      </div>

      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-ink">{ticket.ticket_number ?? "—"}</span>
            <StatusBadge status={ticket.status} />
            <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[ticket.priority as string] ?? ""}`}>
              {ticket.priority}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {CATEGORY_LABELS[ticket.category as string] ?? ticket.category}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            {ticket.customer_name ?? "Unknown customer"}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-slate">
            {ticket.whatsapp_number && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> {ticket.whatsapp_number}
              </span>
            )}
            {ticket.bitlink_phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {ticket.bitlink_phone}
              </span>
            )}
            {ticket.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {ticket.email}
              </span>
            )}
            <span className="text-xs">Created {new Date(ticket.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* WhatsApp button */}
        {ticket.whatsapp_number && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3 font-semibold text-white hover:bg-[#1ebe5d] transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Open in WhatsApp
          </a>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-6">

          {/* Original message */}
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-base font-semibold text-ink">Original message</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-slate">{ticket.message}</p>
          </section>

          {/* Notes thread */}
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-base font-semibold text-ink">Notes &amp; activity</h2>

            {messages && messages.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {messages.map((m) => (
                  <div key={m.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-slate-600">
                        {m.channel} · {m.direction}
                      </span>
                      <span className="text-xs text-muted-slate">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink">{m.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-slate">No notes yet.</p>
            )}

            {/* Add note form */}
            <form action={addTicketNoteAction} className="mt-5 grid gap-3">
              <input type="hidden" name="ticketId" value={ticketId} />
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Add a note, call log, or update…"
                className="w-full rounded-2xl border border-ink/10 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-link-blue focus:ring-2 focus:ring-link-blue/15"
              />
              <button
                type="submit"
                className="w-fit rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/80"
              >
                Add note
              </button>
            </form>
          </section>
        </div>

        <div className="grid gap-6 content-start">

          {/* Ticket management */}
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-base font-semibold text-ink">Manage ticket</h2>

            <div className="mt-4 grid gap-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted-slate uppercase tracking-wide">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => {
                    const active = ticket.status === s;
                    return (
                      <form key={s} action={updateTicketStatusAction.bind(null, ticketId, s)}>
                        <button
                          type="submit"
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? "bg-ink text-white"
                              : "border border-ink/10 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {s.replace(/_/g, " ")}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted-slate uppercase tracking-wide">Priority</p>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((p) => {
                    const active = ticket.priority === p;
                    return (
                      <form key={p} action={updateTicketPriorityAction.bind(null, ticketId, p)}>
                        <button
                          type="submit"
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                            active
                              ? "bg-ink text-white"
                              : "border border-ink/10 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Customer context */}
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <h2 className="text-base font-semibold text-ink">Account context</h2>
            {customer ? (
              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-slate">Name</span>
                  <span className="font-semibold text-ink">{customer.full_name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-slate">Email</span>
                  <span className="text-ink">{customer.email ?? "—"}</span>
                </div>
                {subscription && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-slate">Plan</span>
                      <span className="text-ink">{(subscription.plans as { name?: string } | null)?.name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-slate">Sub status</span>
                      <StatusBadge status={subscription.status} />
                    </div>
                  </>
                )}
                {telecomLine && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-slate">Line status</span>
                      <StatusBadge status={telecomLine.status} />
                    </div>
                    {telecomLine.provider_line_id && (
                      <div className="flex justify-between gap-2">
                        <span className="text-muted-slate">Provider ID</span>
                        <span className="font-mono text-xs text-ink">{String(telecomLine.provider_line_id).slice(0, 12)}…</span>
                      </div>
                    )}
                    <Link
                      href={`/admin/lines/${telecomLine.id}`}
                      className="mt-1 flex items-center gap-1 text-xs font-semibold text-link-blue hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View line details
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-slate">
                No linked account found. Customer may not have signed up yet.
              </p>
            )}
          </section>

          {/* Macros */}
          <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Saved replies</h2>
              <Link href="/admin/support/macros" className="text-xs font-semibold text-link-blue hover:underline">
                Manage
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {categoryMacros.length > 0 && (
                <>
                  <p className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-slate">
                    For this category
                  </p>
                  {categoryMacros.map((m) => (
                    <MacroCard key={m.id} macro={m} ticketId={ticketId} />
                  ))}
                </>
              )}
              {otherMacros.length > 0 && (
                <>
                  <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-widest text-muted-slate">
                    Other replies
                  </p>
                  {otherMacros.map((m) => (
                    <MacroCard key={m.id} macro={m} ticketId={ticketId} />
                  ))}
                </>
              )}
              {!allMacros?.length && (
                <p className="text-sm text-muted-slate">No macros yet. <Link href="/admin/support/macros" className="text-link-blue hover:underline">Create one.</Link></p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

