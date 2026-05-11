export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/80 p-4 text-sm font-medium text-muted-slate">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-link-blue" />
      {label}
    </div>
  );
}
