export function ConnectionOrb() {
  return (
    <div className="relative mx-auto aspect-[0.72] w-full max-w-[25rem] overflow-hidden rounded-[2.5rem] border border-white/40 bg-white/12 p-5 shadow-liquid backdrop-blur">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(103,232,249,0.42),transparent_30%),radial-gradient(circle_at_75%_70%,rgba(34,197,94,0.20),transparent_32%),linear-gradient(145deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04))]" />
      <div className="noise-overlay absolute inset-0 opacity-50" />

      <div className="relative h-full rounded-[2rem] border border-white/25 bg-ink/92 p-5 text-white shadow-2xl">
        <div className="mx-auto mb-6 h-1.5 w-20 rounded-full bg-white/18" />

        <svg viewBox="0 0 320 420" className="absolute inset-0 h-full w-full" role="img" aria-label="Abstract BitLink network signal">
          <defs>
            <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#67E8F9" />
              <stop offset="1" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <path
            className="connection-line"
            d="M54 284 C110 184 154 248 196 150 C225 83 260 92 292 64"
            fill="none"
            stroke="url(#lineGradient)"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            className="connection-line"
            d="M42 112 C92 122 106 188 158 190 C212 192 226 260 288 272"
            fill="none"
            stroke="rgba(103,232,249,0.48)"
            strokeLinecap="round"
            strokeWidth="2"
          />
          {[
            [54, 284],
            [158, 190],
            [196, 150],
            [292, 64],
            [288, 272],
          ].map(([cx, cy], index) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r={18 + index * 2} fill="none" stroke="rgba(103,232,249,0.10)" />
              <circle cx={cx} cy={cy} r="6" fill={index === 1 ? "#22C55E" : "#67E8F9"} />
            </g>
          ))}
        </svg>

        <div className="relative z-10 flex h-full flex-col justify-end">
          <div className="mb-4 inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            Activation handled by BitLink
          </div>
          <div className="rounded-[1.5rem] border border-white/14 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-cyan-100">Selected plan</p>
                <p className="mt-1 text-xl font-semibold">Israel Plus</p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-ink">$49.99</div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-soft-cyan to-trust-green" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
