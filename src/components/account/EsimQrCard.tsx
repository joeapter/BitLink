import QRCode from "qrcode";
import { QrCode } from "lucide-react";

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

  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
        <QrCode className="h-4 w-4" aria-hidden="true" />
        Install your eSIM
      </p>
      <p className="mt-1 text-xs text-blue-700">
        Scan this QR code in your phone&apos;s settings, or use the activation code below.
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
          <p className="mt-0.5 text-xs text-blue-700 leading-5">Settings → Connections → SIM Manager → Add eSIM</p>

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
    </div>
  );
}
