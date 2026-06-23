import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { requireProfile } from "@/lib/auth/server";
import { createNoIndexMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createNoIndexMetadata("Account");

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireProfile();

  return <AccountShell profile={profile}>{children}</AccountShell>;
}
