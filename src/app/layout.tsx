import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebAnalytics } from "@/components/layout/WebAnalytics";
import { Footer } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  defaultOgImage,
  indexRobots,
  jsonLdScriptProps,
  siteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Modern Israeli Telecom`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/assets/favicon.ico",
    shortcut: "/assets/favicon.ico",
    apple: "/apple-icon.png",
  },
  // Home-screen install (iOS): open full-screen, use the brand icon, and show
  // "BitLink" under the icon. Android reads the same intent from the manifest.
  appleWebApp: {
    capable: true,
    title: "BitLink",
    statusBarStyle: "default",
  },
  openGraph: {
    title: `${SITE_NAME} | Modern Israeli Telecom`,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Modern Israeli Telecom`,
    description: DEFAULT_DESCRIPTION,
    images: [defaultOgImage.url],
  },
  robots: indexRobots,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7fafc",
};

// trim(): the env var once shipped with a trailing newline that produced an
// unterminated string in the inline script and killed GA sitewide.
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScriptProps(siteJsonLd)} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
        <WebAnalytics />
        <SpeedInsights />
        {/* Native script tags rendered server-side — Next's client-side script
            injection throws "Invalid or unexpected token" on this site (both
            @next/third-parties and next/script inline), which is why GA4
            collected nothing. Parse-time execution has no injection step.

            The path guard must run in the browser: this layout is one shared
            server component (and public pages are statically prerendered), so
            the server never knows which path is being served.

            /admin and /account are excluded via window['ga-disable-<id>'],
            gtag's documented kill switch, checked per hit. A load-time-only
            path check is not enough: gtag's enhanced measurement fires
            page_views on client-side navigations, so a session entering on a
            public page leaked hits when it navigated into /admin. The flag is
            re-synced by patching pushState/replaceState — this inline script
            runs before the async gtag.js, so gtag's own history wrapper wraps
            ours and the flag is already correct when it fires. Config always
            runs; the flag decides per path what actually sends. */}
        {gaMeasurementId ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(){var d='ga-disable-${gaMeasurementId}';function sync(){window[d]=/^\\/(admin|account)(\\/|$)/.test(location.pathname);}sync();var ps=history.pushState;history.pushState=function(){var r=ps.apply(this,arguments);sync();return r;};var rs=history.replaceState;history.replaceState=function(){var r=rs.apply(this,arguments);sync();return r;};addEventListener('popstate',sync);window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaMeasurementId}');})();`,
              }}
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
