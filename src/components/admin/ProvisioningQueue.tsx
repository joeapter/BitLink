import { updateProvisioningStatusAction } from "@/lib/admin/actions";
import { provisioningLabels, provisioningStatuses } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

type QueueOrder = {
  id: string;
  customer_id: string | null;
  payment_status: string;
  order_status: string;
  provisioning_status: string;
  created_at: string;
};

export function ProvisioningQueue({ orders }: { orders: QueueOrder[] }) {
  if (!orders.length) {
    return <EmptyState title="Provisioning queue is clear">New paid orders will appear here for manual activation handling.</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {orders.map((order) => (
        <form
          key={order.id}
          action={updateProvisioningStatusAction}
          className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="orderId" value={order.id} />
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-slate">{order.id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={order.payment_status} />
                <StatusBadge status={order.provisioning_status} label={provisioningLabels[order.provisioning_status as keyof typeof provisioningLabels] ?? order.provisioning_status} />
              </div>
              <p className="mt-3 text-xs text-muted-slate">Created {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="grid w-full gap-3 sm:w-auto sm:min-w-[22rem]">
              <select
                name="status"
                defaultValue={order.provisioning_status}
                className="h-11 rounded-2xl border border-ink/10 bg-slate-50 px-3 text-sm font-semibold text-ink outline-none focus:border-link-blue focus:ring-4 focus:ring-link-blue/15"
              >
                {provisioningStatuses.map((status) => (
                  <option key={status} value={status}>
                    {provisioningLabels[status]}
                  </option>
                ))}
              </select>
              <input
                name="note"
                placeholder="Optional internal note"
                className="h-11 rounded-2xl border border-ink/10 bg-slate-50 px-3 text-sm text-ink outline-none focus:border-link-blue focus:ring-4 focus:ring-link-blue/15"
              />
              <Button type="submit" size="sm">
                Update status
              </Button>
            </div>
          </div>
        </form>
      ))}
    </div>
  );
}
