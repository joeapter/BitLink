import type { Metadata } from "next";
import { PartnerDiscountPage } from "@/components/marketing/PartnerDiscountPage";
import { createNoIndexMetadata } from "@/lib/seo";

// Unlisted discount page for Neveh Zion parents (Student 5G) — not in the
// sitemap, not linked from the regular partner page, not indexed. Handed out
// directly by Joe. See PartnerDiscountPage for how the discount is applied.

export const metadata: Metadata = createNoIndexMetadata(
  "A Discount for Neveh Zion Families",
  "Activation fee waived and a discounted US/Canada/UK add-on line for Neveh Zion parents.",
);

export default function NevehZionDiscountPage() {
  return (
    <PartnerDiscountPage
      partnerSlug="neveh-zion"
      planSlug="student-5g"
      promoCode="neveh-discount"
      headline="A phone, set up before he flies — activation fee on us."
    />
  );
}
