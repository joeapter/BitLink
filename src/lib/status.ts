export const provisioningStatuses = [
  "new_order",
  "payment_confirmed",
  "awaiting_sim_assignment",
  "sim_assigned",
  "activation_sent",
  "active",
  "suspended",
  "cancelled",
] as const;

export type ProvisioningStatus = (typeof provisioningStatuses)[number];

export const provisioningLabels: Record<ProvisioningStatus, string> = {
  new_order: "New order",
  payment_confirmed: "Payment confirmed",
  awaiting_sim_assignment: "Awaiting SIM assignment",
  sim_assigned: "SIM assigned",
  activation_sent: "Activation sent",
  active: "Active",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export const subscriptionStatuses = [
  "incomplete",
  "trialing",
  "active",
  "past_due",
  "canceled",
  "unpaid",
] as const;

export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export function statusTone(status?: string | null): BadgeTone {
  if (!status) return "neutral";
  if (["active", "paid", "complete", "payment_confirmed", "sim_assigned", "activation_sent"].includes(status)) {
    return "success";
  }
  if (["new_order", "awaiting_sim_assignment", "trialing", "incomplete"].includes(status)) {
    return "info";
  }
  if (["past_due", "open", "pending"].includes(status)) {
    return "warning";
  }
  if (["cancelled", "canceled", "failed", "unpaid", "suspended"].includes(status)) {
    return "danger";
  }
  return "neutral";
}
