// Order details shown beside the embedded payment form — gives the checkout
// an "internal system" feel: who's ordering and exactly what they're getting.

export function OrderInfoPanel({
  info,
  planName,
  simType,
  portNumber,
  hasIntlNumber,
}: {
  info: { fullName: string; email: string; phone: string } | null;
  planName: string;
  simType: "esim" | "physical";
  portNumber: string | null;
  hasIntlNumber: boolean;
}) {
  const rows: Array<[string, string]> = [];
  if (info?.fullName) rows.push(["Customer", info.fullName]);
  if (info?.email) rows.push(["Email", info.email]);
  if (info?.phone) rows.push(["Contact phone", info.phone]);
  rows.push(["Plan", planName]);
  rows.push(["SIM", simType === "esim" ? "eSIM — sent by email after payment" : "Physical SIM — mailed or assigned by support"]);
  rows.push(portNumber ? ["Porting number", `${portNumber} (verified)`] : ["Israeli number", "New number assigned at activation"]);
  if (hasIntlNumber) rows.push(["Add-on", "US/Canada/UK local number (+$9.99/mo)"]);

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-soft">
      <p className="text-sm font-semibold text-link-blue">Order details</p>
      <dl className="mt-4 grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 border-b border-ink/5 pb-3 last:border-b-0 last:pb-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-slate">{label}</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
