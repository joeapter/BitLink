import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function Select({ label, error, className, id, children, ...props }: Props) {
  const selectId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-medium text-ink" htmlFor={selectId}>
      {label ? <span>{label}</span> : null}
      <select
        id={selectId}
        className={cn(
          "h-12 w-full rounded-2xl border border-ink/10 bg-white/90 px-4 text-base text-ink shadow-sm outline-none transition focus:border-link-blue focus:ring-4 focus:ring-link-blue/15",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
