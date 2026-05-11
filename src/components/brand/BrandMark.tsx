import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)} aria-label="BitLink home">
      <span className="relative grid h-10 w-10 place-items-center rounded-full bg-ink text-white shadow-soft">
        <span className="absolute inset-1 rounded-full border border-white/20" />
        <span className="h-3 w-3 rounded-full bg-soft-cyan shadow-[0_0_22px_rgba(103,232,249,0.9)]" />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-semibold tracking-normal text-ink">BitLink</span>
        <span className="block text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted-slate">
          Telecom
        </span>
      </span>
    </Link>
  );
}
