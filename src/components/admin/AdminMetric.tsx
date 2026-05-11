import type { LucideIcon } from "lucide-react";

export function AdminMetric({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red";
}) {
  const toneClass = {
    blue: "bg-sky-50 text-sky-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
      <div className={`grid h-10 w-10 place-items-center rounded-full ${toneClass}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-5 text-sm font-semibold text-muted-slate">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-normal text-ink">{value}</p>
    </div>
  );
}
