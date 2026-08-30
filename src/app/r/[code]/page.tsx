import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createNoIndexMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/utils";
import { isRepCode, isRepLanding, repDestinationPath, type RepLanding } from "@/lib/rep-links";
import { RepRedirect } from "@/components/marketing/RepRedirect";

export const dynamic = "force-dynamic";

async function lookupRep(code: string): Promise<{ name: string; landing: RepLanding } | null> {
  if (!isRepCode(code)) return null;
  const db = createSupabaseAdminClient();
  if (!db) return null;
  const { data } = await db
    .from("affiliates")
    .select("name, landing, status")
    .eq("code", code)
    .maybeSingle();
  if (!data || data.status !== "active") return null;
  return {
    name: (data.name as string) ?? "",
    landing: isRepLanding(data.landing) ? data.landing : "trial",
  };
}

// The share preview is the whole point of this route existing: a scraper that
// followed an HTTP redirect would render the destination page's preview, not
// the Rep's QR card.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();
  const base = createNoIndexMetadata(
    "BitLink Powered by one of Israel’s leading 5G networks",
    "Start a real Israeli line — scan the code or tap through.",
  );
  if (!isRepCode(normalized)) return base;

  return {
    ...base,
    openGraph: {
      title: "BitLink Powered by one of Israel’s leading 5G networks",
      description: "Scan the code to start a real Israeli line.",
      images: [
        {
          url: absoluteUrl(`/api/og/rep?code=${encodeURIComponent(normalized)}`),
          width: 1200,
          height: 630,
          alt: "Scan to get started with BitLink",
        },
      ],
    },
  };
}

export default async function RepLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();
  const rep = await lookupRep(normalized);
  if (!rep) notFound();

  const destination = repDestinationPath(normalized, rep.landing);

  // Redirected on the client rather than server-side on purpose. A 3xx would
  // send link scrapers to the destination page, and they'd show that page's
  // preview instead of this Rep's QR card — which is the reason this route
  // exists. Scrapers don't run scripts, so they stay here and read the tags
  // above; people are moved along immediately.
  return <RepRedirect to={destination} repName={rep.name} />;
}
