"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Loader2, MessageCircle } from "lucide-react";
import { whatsappGreeting, whatsappWebUrl } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MakeSalesRepButton } from "@/components/admin/MakeSalesRepButton";
import { RequestReviewButton } from "@/components/admin/RequestReviewButton";
import { makeSalesRepAction } from "@/lib/admin/sales-rep-actions";
import { sendReviewRequestAction } from "@/lib/admin/review-request-actions";
import { archiveCustomersAction, unarchiveCustomersAction } from "@/lib/admin/customer-actions";
import { formatDate } from "@/lib/utils";

export type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  referral_code: string | null;
  user_id: string | null;
  created_at: string;
  plans: string[];
  reviewRequestedAt: string | null;
  salesRep: { status: string; referral_code: string } | null;
};

export function CustomerTable({ customers, view }: { customers: CustomerRow[]; view: "active" | "archived" }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const allSelected = customers.length > 0 && selected.size === customers.length;
  const isArchiveView = view === "active";

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)));
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function customerName(c: CustomerRow) {
    return c.full_name || c.email || c.id;
  }

  // Archiving is safe/reversible in general, but a customer with an active
  // line is a real, live customer — Joe was explicit he'd never mean to
  // archive one of those by accident, so this blocks and calls it out by
  // name instead of a generic confirm().
  function runArchive(ids: string[], action: "archive" | "unarchive") {
    const targets = customers.filter((c) => ids.includes(c.id));
    if (action === "archive") {
      const withLines = targets.filter((c) => c.plans.length > 0);
      if (withLines.length > 0) {
        window.alert(
          `Stopped: ${withLines.length === 1 ? "this customer has" : "these customers have"} an active line and won't be archived:\n\n` +
            withLines.map((c) => `• ${customerName(c)} (${c.plans.join(", ")})`).join("\n") +
            `\n\nUnselect ${withLines.length === 1 ? "them" : "them"} to archive the rest, or terminate the line first if you really mean to archive this account.`,
        );
        return;
      }
    }

    const verb = action === "archive" ? "Archive" : "Restore";
    if (!window.confirm(`${verb} ${targets.length} customer${targets.length === 1 ? "" : "s"}?\n\n${targets.map(customerName).join(", ")}`)) {
      return;
    }

    startTransition(async () => {
      const result = action === "archive" ? await archiveCustomersAction(ids) : await unarchiveCustomersAction(ids);
      setNotice(`${result.count} customer${result.count === 1 ? "" : "s"} ${action === "archive" ? "archived" : "restored"}.`);
      setSelected(new Set());
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-ink/8 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-ink">{selected.size} selected</p>
          <button
            type="button"
            onClick={() => runArchive([...selected], isArchiveView ? "archive" : "unarchive")}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : isArchiveView ? (
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {isArchiveView ? "Archive selected" : "Restore selected"}
          </button>
        </div>
      )}

      {notice ? (
        <div className="border-b border-ink/8 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">{notice}</div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-muted-slate">
            <tr>
              <th className="w-9 px-3 py-3">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-link-blue" aria-label="Select all" />
              </th>
              <th className="px-3 py-3 font-semibold">Customer</th>
              <th className="px-3 py-3 font-semibold">Plan</th>
              <th className="px-3 py-3 font-semibold">Phone</th>
              <th className="px-3 py-3 font-semibold">Stripe</th>
              <th className="px-3 py-3 font-semibold">Referral</th>
              <th className="px-3 py-3 font-semibold">Sales rep</th>
              <th className="px-3 py-3 font-semibold">Order</th>
              <th className="px-3 py-3 font-semibold">Review</th>
              <th className="px-3 py-3 font-semibold">Created</th>
              <th className="w-9 px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8">
            {customers.map((customer) => {
              const name = customerName(customer);
              return (
                <tr key={customer.id} className={selected.has(customer.id) ? "bg-link-blue/5" : undefined}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(customer.id)}
                      onChange={() => toggleOne(customer.id)}
                      className="accent-link-blue"
                      aria-label={`Select ${name}`}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-ink">{customer.full_name ?? "Unnamed customer"}</div>
                    <div className="text-xs text-muted-slate">{customer.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    {customer.plans.length ? (
                      <div className="flex flex-wrap gap-1">
                        {customer.plans.map((p, i) => (
                          <span key={i} className="rounded-full bg-link-blue/10 px-2 py-0.5 text-xs font-semibold text-link-blue">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-slate">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {customer.phone ? (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {customer.phone}
                        <a
                          href={whatsappWebUrl(customer.phone, whatsappGreeting(customer.full_name)) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Message on WhatsApp (business account)"
                          className="inline-flex items-center rounded-full bg-emerald-50 p-1 text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={customer.stripe_customer_id ? "active" : "pending"} label={customer.stripe_customer_id ? "Connected" : "Missing"} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-500">{customer.referral_code ?? "—"}</td>
                  <td className="px-3 py-3">
                    {customer.salesRep ? (
                      <div className="grid gap-1">
                        <StatusBadge status={customer.salesRep.status} label="Rep" />
                        <span className="font-mono text-xs text-slate-500">{customer.salesRep.referral_code}</span>
                      </div>
                    ) : customer.user_id ? (
                      <form action={makeSalesRepAction}>
                        <input type="hidden" name="customerId" value={customer.id} />
                        <MakeSalesRepButton />
                      </form>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Needs login</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/admin/custom-orders?customer=${customer.id}`}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-link-blue/30 bg-[#e6fbff] px-2.5 py-1 text-xs font-semibold text-ink shadow-sm transition hover:bg-[#d8f7fd]"
                    >
                      Build order
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    {customer.reviewRequestedAt ? (
                      <span className="whitespace-nowrap text-xs text-muted-slate">
                        Asked {formatDate(customer.reviewRequestedAt)}
                      </span>
                    ) : customer.email ? (
                      <form action={sendReviewRequestAction}>
                        <input type="hidden" name="customerId" value={customer.id} />
                        <RequestReviewButton />
                      </form>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">No email</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{formatDate(customer.created_at)}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => runArchive([customer.id], isArchiveView ? "archive" : "unarchive")}
                      disabled={pending}
                      className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                      aria-label={isArchiveView ? `Archive ${name}` : `Restore ${name}`}
                      title={isArchiveView ? "Archive" : "Restore"}
                    >
                      {isArchiveView ? <Archive className="h-4 w-4" aria-hidden="true" /> : <ArchiveRestore className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
