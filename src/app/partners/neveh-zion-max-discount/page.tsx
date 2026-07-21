import type { Metadata } from "next";
import { PartnerDiscountPage } from "@/components/marketing/PartnerDiscountPage";
import { createNoIndexMetadata } from "@/lib/seo";

// Unlisted discount page for Neveh Zion parents (Max 5G) — not in the sitemap,
// not linked from the regular partner page, not indexed. Handed out directly
// by Joe. See PartnerDiscountPage for how the discount is applied.

export const metadata: Metadata = createNoIndexMetadata(
  "A Max 5G Discount for Neveh Zion Families",
  "Activation fee waived and a discounted US/Canada/UK add-on line for Neveh Zion parents, on the Max 5G plan.",
);

export default function NevehZionMaxDiscountPage() {
  return (
    <PartnerDiscountPage
      partnerSlug="neveh-zion"
      planSlug="max-5g"
      promoCode="neveh-discount"
      headline="More data than he'll get through — activation fee on us."
    />
  );
}
