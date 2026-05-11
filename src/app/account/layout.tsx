import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { requireProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireProfile();

  return <AccountShell profile={profile}>{children}</AccountShell>;
}
