import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ProviderOrder, ProviderResult, SimData, TelecomProvider } from "./provider-types";

async function writeProvisioningEvent(input: {
  orderId?: string | null;
  customerId?: string | null;
  status: string;
  note: string;
}) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("provisioning_events").insert({
    order_id: input.orderId ?? null,
    customer_id: input.customerId ?? null,
    status: input.status,
    note: input.note,
  });
}

function result(status: string, message: string): ProviderResult {
  return { ok: true, status, message, reference: `manual_${Date.now()}` };
}

export const manualProvider: TelecomProvider = {
  async createActivationRequest(order: ProviderOrder) {
    await writeProvisioningEvent({
      orderId: order.id,
      customerId: order.customer_id,
      status: "awaiting_sim_assignment",
      note: "Manual activation request created. Connect a real provider API here when ready.",
    });
    return result("awaiting_sim_assignment", "Activation request queued for manual BitLink handling.");
  },

  async assignSim(orderId: string, simData: SimData) {
    await writeProvisioningEvent({
      orderId,
      status: "sim_assigned",
      note: `Manual SIM assignment placeholder.${simData.iccid ? ` ICCID: ${simData.iccid}.` : ""}`,
    });
    return result("sim_assigned", "SIM assignment recorded for manual provisioning.");
  },

  async sendActivationInstructions(customerId: string) {
    await writeProvisioningEvent({
      customerId,
      status: "activation_sent",
      note: "Activation instructions marked as sent by the manual provider stub.",
    });
    return result("activation_sent", "Activation instructions placeholder completed.");
  },

  async suspendService(customerId: string) {
    await writeProvisioningEvent({
      customerId,
      status: "suspended",
      note: "Manual suspension placeholder. No telecom provider API was called.",
    });
    return result("suspended", "Service suspension queued in manual mode.");
  },

  async cancelService(customerId: string) {
    await writeProvisioningEvent({
      customerId,
      status: "cancelled",
      note: "Manual cancellation placeholder. No telecom provider API was called.",
    });
    return result("cancelled", "Service cancellation queued in manual mode.");
  },

  async getUsage(customerId: string) {
    return {
      ...result("manual_usage_unavailable", "Usage is unavailable until a telecom provider API is connected."),
      usage: {
        customerId,
        mode: "manual_mvp",
      },
    };
  },
};
