// Partner page slug → organization referral code.
//
// Kept as its own tiny module because middleware.ts imports it (edge bundle —
// keep it free of heavy imports). Visiting /partners/<slug> sets the same
// bl_org attribution cookie as ?org=<code>, so partners get a clean URL to
// share with tracking built in. Codes must match organizations.referral_code
// in the database.

export const partnerOrgCodes: Record<string, string> = {
  "neveh-zion": "ORG-34CC7856",
  sharfmans: "ORG-75238222",
};

// Reverse lookup — lets the admin org page link to the partner page when one
// exists instead of a bare ?org= URL.
export function getPartnerSlugForOrgCode(code: string): string | undefined {
  const normalized = code.toUpperCase();
  return Object.keys(partnerOrgCodes).find((slug) => partnerOrgCodes[slug] === normalized);
}
