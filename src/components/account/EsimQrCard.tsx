import QRCode from "qrcode";
import { QrCode, Smartphone } from "lucide-react";
import { buildAppleEsimInstallUrl } from "@/lib/esim";

interface Props {
  activationCode: string;
  iccId?: string;
}

// Server component — the QR is generated locally as a data URL. No external
// QR service: the activation code never leaves our infrastructure, and the
// image can't fail to load because a third party is slow or blocked.
export async function EsimQrCard({ activationCode, iccId }: Props) {
  const qrDataUrl = await QRCode.toDataURL(activationCode, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
  });
  const appleInstallUrl = buildAppleEsimInstallUrl(activationCode);

  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
        <QrCode className="h-4 w-4" aria-hidden="true" />
        Install your eSIM
      </p>
      <p className="mt-1 text-xs text-blue-700">
        Scan this QR code in your phone&apos;s settings, or use the activation code below.
      </p>

      {/* If they're viewing this page on the phone that needs the eSIM,
          there's nothing to scan — this installs directly. */}
      <a
        href={appleInstallUrl}
        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-blue-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-800"
      >
        <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
        On an iPhone right now? Tap to install directly
      </a>
      <p className="mt-1.5 text-center text-[0.65rem] text-blue-600">
        Only tap this if you&apos;re viewing this page on the iPhone you want the eSIM on.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* QR image — locally generated data URL */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="eSIM QR code"
          width={160}
          height={160}
          className="shrink-0 rounded-xl border border-blue-200 bg-white p-1"
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-blue-800">iOS</p>
          <p className="mt-0.5 text-xs text-blue-700 leading-5">Settings → Mobile → Add eSIM → Use QR Code</p>

          <p className="mt-2 text-xs font-semibold text-blue-800">Android</p>
          <p className="mt-0.5 text-xs text-blue-700 leading-5">
            Settings → Connections → SIM Manager → Add eSIM (look for &quot;scan from photo&quot; if you&apos;re on
            the same device — no second phone needed)
          </p>

          {/* Manual activation code */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-blue-800">Manual entry code</p>
            <p className="mt-1 break-all rounded-lg bg-white px-2 py-2 font-mono text-[0.6rem] leading-5 text-blue-900 border border-blue-200">
              {activationCode}
            </p>
          </div>

          {iccId && (
            <p className="mt-2 text-[0.6rem] text-blue-600">ICC: {iccId}</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-[0.65rem] text-blue-600">
        Only attempt install once — eSIM codes are single-use. If it seems stuck or fails, don&apos;t retry; message
        support and we&apos;ll issue a fresh one.
      </p>
    </div>
  );
}
