import type { ReactNode } from "react";
import { CircleDashed } from "lucide-react";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-ink/15 bg-white/70 p-8 text-center shadow-sm">
      <CircleDashed className="mx-auto mb-4 h-8 w-8 text-link-blue" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children ? <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-slate">{children}</div> : null}
    </div>
  );
}
