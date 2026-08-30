// The share preview for a Rep's trial link.
//
// When a Rep sends https://bitlink.co.il/trial?ref=BLITZ on WhatsApp, the
// preview used to be the generic site header — nothing a recipient could act
// on. This renders a card carrying that Rep's own QR code, so the person
// receiving the message can scan it off the screen of whoever showed them,
// which is how these links actually spread in person.
//
// Reached via generateMetadata on /trial, which points openGraph.images here
// with the ref attached. Each ?ref= is a distinct URL, so WhatsApp caches a
// separate preview per Rep rather than one shared image.
//
// Node runtime, not edge: the QR is generated with the `qrcode` package.

import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { absoluteUrl } from '@/lib/utils';
import { repSharePath } from '@/lib/rep-links';

export const runtime = 'nodejs';

// Matches the normalisation in rep-actions.ts, so a code that works as a
// referral renders here and anything else is rejected rather than drawn.
const CODE = /^[A-Z0-9-]{1,32}$/;

const INK = '#071428';
const BLUE = '#00aeca';
const SLATE = '#5b7183';

export async function GET(request: Request): Promise<Response> {
  const code = (new URL(request.url).searchParams.get('code') ?? '').trim().toUpperCase();
  // Encodes the Rep's stable /r/<code> link, not a destination. A printed or
  // forwarded QR keeps working after the Rep is switched between the trial and
  // the plans page.
  const target = CODE.test(code) ? absoluteUrl(repSharePath(code)) : absoluteUrl('/plans');

  // Rendered large and scaled down by the layout — a QR resampled up from a
  // small bitmap loses the crisp module edges scanners rely on.
  const qr = await QRCode.toDataURL(target, {
    width: 640,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: INK, light: '#ffffff' },
  });

  // Satori fetches these itself. They're served from our own /public, so no
  // third-party host sits between a share and its preview.
  const bitlinkLogo = absoluteUrl('/assets/logo-og.png');
  const partnerLogo = absoluteUrl('/assets/partner-logo.png');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          padding: '40px 56px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Ours on the left, the network's on the right — the Partner mark
            carries its own turquoise ground, so it reads as a badge rather
            than something that failed to knock out. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bitlinkLogo} width={186} height={62} alt="BitLink" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={partnerLogo} width={120} height={80} alt="Partner" style={{ borderRadius: 12 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            width={360}
            height={360}
            alt=""
            style={{ border: `2px solid ${BLUE}`, borderRadius: 20 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: INK, letterSpacing: '-0.5px' }}>
            Powered by Partner
          </div>
          <div style={{ fontSize: 24, color: SLATE, marginTop: 8 }}>
            One of Israel&#8217;s leading 5G networks
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // The card only changes when the Rep's code does, and the code is in
        // the URL — so this is safe to cache hard, which also keeps WhatsApp's
        // scraper off the render path on every share.
        'cache-control': 'public, max-age=3600, s-maxage=86400, immutable',
      },
    },
  );
}
