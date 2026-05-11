import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, id, ...props }: Props) {
  const textareaId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-medium text-ink" htmlFor={textareaId}>
      {label ? <span>{label}</span> : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-32 w-full resize-y rounded-2xl border border-ink/10 bg-white/90 px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-link-blue focus:ring-4 focus:ring-link-blue/15",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
