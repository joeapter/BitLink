import { getTelecomProvider } from "@/lib/telecom/provider.registry";
import type { LineSimInfo } from "@/types/telecom";
import { recycleEsimProfileAction } from "@/lib/admin/line-actions";
import { QrCode, RefreshCw } from "lucide-react";

interface Props {
  lineId: string;
  providerLineId: string;
  sims: LineSimInfo[];
}

export async function EsimProfileCard({ lineId, providerLineId, sims }: Props) {
  const esimSims = sims.filter((s) => s.type === "esim");
  if (!esimSims.length) return null;

  const provider = getTelecomProvider();

  const profiles = await Promise.all(
    esimSims.map(async (sim) => {
      try {
        const profile = await provider.getEsimProfile(sim.id);
        return { sim, profile, error: null };
      } catch (err) {
        return { sim, profile: null, error: err instanceof Error ? err.message : "Failed" };
      }
    }),
  );

  return (
    <section className="rounded-[2rem] border border-blue-200 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
        <QrCode className="h-5 w-5 text-blue-600" />
        eSIM Profiles
      </h2>
      <p className="mt-1 text-xs text-muted-slate">
        Share the activation code with the customer to install the eSIM.
      </p>

      <div className="mt-5 grid gap-6">
        {profiles.map(({ sim, profile, error }) => (
          <div key={sim.id} className="rounded-2xl border border-ink/8 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-ink">ICC: {sim.iccId}</p>
                {sim.isMain && (
                  <span className="text-xs text-emerald-700">Main SIM</span>
                )}
              </div>
              <form action={recycleEsimProfileAction}>
                <input type="hidden" name="simId" value={sim.id} />
                <input type="hidden" name="lineId" value={lineId} />
                <button
                  type="submit"
                  title="Generate new eSIM profile (customer must re-install)"
                  className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw className="h-3 w-3" />
                  Recycle profile
                </button>
              </form>
            </div>

            {error ? (
              <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>
            ) : profile ? (
              <div className="mt-4 grid gap-3">
                <div>
                  <p className="text-xs font-semibold text-muted-slate">Activation code (LPA string)</p>
                  <p className="mt-1 break-all rounded-xl bg-ink/5 p-3 font-mono text-xs text-ink">
                    {profile.activationCode}
                  </p>
                </div>
                {profile.smDpPlusAddress && (
                  <div>
                    <p className="text-xs font-semibold text-muted-slate">SM-DP+ server</p>
                    <p className="mt-1 font-mono text-xs text-ink">{profile.smDpPlusAddress}</p>
                  </div>
                )}
                {profile.confirmationCode && (
                  <div>
                    <p className="text-xs font-semibold text-muted-slate">Confirmation code</p>
                    <p className="mt-1 font-mono text-xs text-ink">{profile.confirmationCode}</p>
                  </div>
                )}
                <p className="text-[0.65rem] text-muted-slate">
                  Customer installs via Settings → Mobile → Add eSIM → Enter code manually, or scan QR from this string.
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
