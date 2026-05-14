import type { Metadata } from "next";

const signatureImagePath = "/assets/bitlink-signature.png";

export const metadata: Metadata = {
  title: "Email Signature",
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmailSignaturePage() {
  const hostedImageUrl =
    "https://raw.githubusercontent.com/joeapter/BitLink/main/public/assets/bitlink-signature.png";
  const html = `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td style="padding:0;margin:0;">
      <img src="${hostedImageUrl}" width="250" height="75" alt="BitLink" style="display:block;border:0;outline:none;text-decoration:none;width:250px;height:75px;max-width:250px;" />
    </td>
  </tr>
</table>`;

  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-link-blue">Hidden BitLink asset</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">
          Email signature image
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-slate">
          This page is intentionally unlinked and marked no-index. Use the direct image URL in email
          signatures so iPhone Mail references a hosted image instead of an embedded attachment.
        </p>

        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-slate-50 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- Email signatures need the raw static image URL, not Next image optimization. */}
          <img
            src={signatureImagePath}
            width={250}
            height={75}
            alt="BitLink"
            className="h-[75px] w-[250px]"
          />
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-ink">HTML</h2>
          <pre className="mt-4 overflow-x-auto rounded-[1.5rem] bg-ink p-5 text-xs leading-6 text-slate-100">
            {html}
          </pre>
        </div>
      </div>
    </section>
  );
}
