import type { Metadata } from "next";
import { LinesPanel } from "@/components/account/LinesPanel";
import { requireUser } from "@/lib/auth/server";
import { getAccountSnapshot } from "@/lib/db/account";

export const metadata: Metadata = {
  title: "Lines",
};

export default async function AccountLinesPage() {
  const user = await requireUser();
  const snapshot = await getAccountSnapshot(user.id);

  return <LinesPanel lines={snapshot.lines} />;
}
