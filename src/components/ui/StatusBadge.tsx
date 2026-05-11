import { statusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const tone = statusTone(status);
  const text = label ?? status?.replaceAll("_", " ") ?? "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize",
        tones[tone],
      )}
    >
      {text}
    </span>
  );
}
