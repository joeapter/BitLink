import type { Metadata } from "next";
import { createNoIndexMetadata } from "@/lib/seo";
import { TempHeroPngTest } from "./TempHeroPngTest";

export const metadata: Metadata = createNoIndexMetadata(
  "Temporary hero image test (PNG) — not a real page",
);

export default function TempHeroPngTestPage() {
  return <TempHeroPngTest />;
}
