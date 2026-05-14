import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="BitLink home">
      <Image
        src="/assets/Logo.png"
        alt="BitLink"
        width={170}
        height={51}
        priority
        className="h-11 w-auto"
      />
    </Link>
  );
}
