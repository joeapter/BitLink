import type { Metadata } from "next";
import { ActivationTimeline } from "@/components/account/ActivationTimeline";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Activation",
};

export default async function AccountActivationPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);

  return (
    <ActivationTimeline
      currentStatus={snapshot.order?.provisioning_status}
      events={snapshot.provisioningEvents}
    />
  );
}
