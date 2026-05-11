import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/layout/SiteHeader";
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
  metadataBase: new URL("https://bitlink.co.il"),
  title: {
    default: "BitLink | Your connection, simplified.",
    template: "%s | BitLink",
  },
  description:
    "BitLink gives you simple monthly connectivity, clean billing, and human support in a smoother telecom experience.",
  applicationName: "BitLink",
  openGraph: {
    title: "BitLink | Mobile plans that feel effortless.",
    description: "Simple monthly plans. Human support. Smooth activation.",
    url: "https://bitlink.co.il",
    siteName: "BitLink",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07111F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
