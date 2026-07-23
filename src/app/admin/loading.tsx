// Shown instantly on every admin navigation while the (dynamic) page renders
// on the server. Without this, clicking an admin link left the previous page
// frozen with no feedback until the whole server render — including external
// Annatel/Stripe calls — finished, which read as a slow/unresponsive click,
// worse on mobile where the round-trip is slower. This is a neutral skeleton
// that covers every admin route (Next.js uses the nearest loading.tsx).
export default function AdminLoading() {
  return (
    <div className="grid animate-pulse gap-4 sm:gap-6" aria-hidden="true">
      <div className="grid gap-2">
        <div className="h-4 w-24 rounded bg-slate-200/70" />
        <div className="h-9 w-64 max-w-[70%] rounded-lg bg-slate-200/70" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200/60 sm:rounded-4xl" />
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="h-52 rounded-2xl bg-slate-200/50 sm:rounded-4xl" />
        <div className="h-52 rounded-2xl bg-slate-200/50 sm:rounded-4xl" />
      </div>
    </div>
  );
}
