# BitLink SEO Audit

Audit date: 2026-06-22  
Scope: Phase 1 audit only. No application or front-end files were changed.  
Project: Next.js 16.2.6 App Router, TypeScript, Supabase, Stripe, Inngest.

## Audit Basis

- Read local project instructions in `AGENTS.md`.
- Read installed Next.js 16 docs before making recommendations:
  - `node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
  - `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/robots.md`
  - `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`
  - `node_modules/next/dist/docs/01-app/02-guides/redirecting.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`
- Ran `npm run typecheck`: passed.
- Ran `npm run lint`: failed on existing issues listed under Performance / code health notes. No fixes were made.

## 1. Current SEO Problems Found

1. No sitemap route exists.
   - Missing `src/app/sitemap.ts` or `src/app/sitemap.xml`.
   - Google has no explicit canonical URL list for public pages.

2. No robots route exists.
   - Missing `src/app/robots.ts` or `src/app/robots.txt`.
   - Admin, account, auth, checkout, support ticket, webhook, cron, and API routes are not explicitly excluded from crawling.

3. Canonicals are not configured per route.
   - `src/app/layout.tsx` sets `metadataBase`, but no pages define `alternates.canonical`.
   - Query routes such as `/checkout?plan=student-5g`, `/login?next=...`, `/signup?referral=...`, and filtered admin URLs can create duplicate/distraction URLs if crawled.

4. Domain consistency is not fully settled in code.
   - Global metadata uses `https://bitlink.co.il`.
   - Legal copy links to `https://www.bitlink.co.il`.
   - The codebase needs one canonical host plus redirects for the other host.

5. Private and transactional pages are not consistently `noindex`.
   - Only `/email-signature` currently declares `robots: { index: false, follow: false }`.
   - `/account/*`, `/admin/*`, `/checkout/*`, `/login`, `/signup`, `/support/ticket/[number]`, auth callbacks, and API routes should not be indexable.
   - `/support/ticket/[number]` displays ticket/customer details and should be treated as sensitive, noindex at minimum.

6. Metadata is incomplete on many pages.
   - Root layout provides default title/description and basic Open Graph.
   - Most public route pages have no canonical, no route-specific Open Graph, and no Twitter card metadata.
   - Several routes have title-only metadata or inherit the generic root title.

7. No structured data / JSON-LD found.
   - No `Organization`, `WebSite`, `Service`, `Product`, `Offer`, `BreadcrumbList`, or `LocalBusiness` schema.
   - This is a missed opportunity for Google to understand the business, plans, and support/contact details.

8. Open Graph and social preview setup is incomplete.
   - Root layout has basic `openGraph`, but no `images`.
   - No route-specific OG images or Twitter card metadata.
   - No `src/app/opengraph-image.*` or `twitter-image.*` files found.

9. App icons are minimal.
   - `public/assets/favicon.ico` exists and is referenced from metadata.
   - No app-root special `favicon.ico`, `icon.*`, `apple-icon.*`, or manifest file was found.

10. Public pages are likely less cache-friendly than they could be.
   - `SiteHeader` calls Supabase `getUser()` in the root layout for signed-in/out display.
   - `middleware.ts` refreshes Supabase auth on almost every non-asset route.
   - In production, this can make marketing pages more dynamic and less cacheable than ideal for crawl performance.

11. Linked placeholder content exists.
   - Footer links to `/legal/acceptable-use`.
   - That route is currently served by `src/app/legal/[slug]/page.tsx` and says the page is being prepared.
   - Placeholder legal pages should not be indexed.

12. Lint currently fails.
   - Existing failures include unescaped legal/support text, one raw internal `<a>` for `/admin/support`, and a React hook performance warning in checkout.
   - TypeScript passes.

## 2. Pages Missing Titles / Descriptions

### Public or potentially public pages

| Route | Current metadata state | Recommendation |
| --- | --- | --- |
| `/` | Inherits root default title/description from `src/app/layout.tsx` | Add explicit homepage canonical, OG, Twitter, and JSON-LD. Title/description are acceptable but can be more keyword-specific. |
| `/plans` | Has title and description | Add canonical, OG/Twitter, and collection/service schema. |
| `/plans/[slug]` | Dynamic title and description from plan data | Add canonical, OG/Twitter, Product or Service + Offer schema, and breadcrumbs. |
| `/refer` | Has title and description | Add canonical and OG/Twitter. Consider whether it should be indexed or treated as conversion-only. |
| `/support` | Has title and description | Add canonical, OG/Twitter, contact/support schema if truthful. |
| `/legal/terms` | Has title and description | Add canonical. Consider noindex if legal/compliance does not require discoverability. |
| `/legal/privacy` | Has title and description | Add canonical. Usually okay to index. |
| `/legal/[slug]` | Title only | Noindex placeholder routes until real content exists, especially `/legal/acceptable-use`. |
| `/legal/plans/[slug]` | No metadata export; inherits generic default title/description | Add noindex or exact legal metadata. These are contract documents with blank customer fields and should probably not be SEO landing pages. |

### Private, transactional, or utility pages

These do not need SEO descriptions if they are noindexed, but they currently lack consistent noindex metadata:

- `/login`: title only.
- `/signup`: title only.
- `/checkout`: title and description, but should likely be noindex.
- `/checkout/success`: title only and dynamic.
- `/checkout/cancel`: title only.
- `/support/ticket/[number]`: title only, dynamic, sensitive.
- `/account`, `/account/activation`, `/account/billing`, `/account/lines`, `/account/referrals`: title only or inherited layout behavior.
- All `/admin/*` pages: title only or generic admin titles.
- `/email-signature`: has noindex already.

## 3. Pages That Should Be Indexable

Recommended indexable canonical pages:

- `/`
- `/plans`
- `/plans/basic`
- `/plans/student-5g`
- `/plans/max-5g`
- `/plans/kosher-basic`
- `/plans/kosher-plus`
- `/support`
- `/refer` if the referral program is intended as a public acquisition page.
- `/legal/privacy`
- `/legal/terms` if legal/compliance wants it public in search.

Conditional:

- `/legal/acceptable-use`: only after the actual acceptable-use policy is written.
- `/legal/plans/[slug]`: probably keep public for users, but noindex unless there is a compliance reason to have plan contracts searchable.

## 4. Pages That Should Be Noindex

Recommended noindex:

- `/login`
- `/signup`
- `/checkout`
- `/checkout/success`
- `/checkout/cancel`
- `/support/ticket/[number]`
- `/email-signature`
- `/account`
- `/account/activation`
- `/account/billing`
- `/account/lines`
- `/account/referrals`
- `/admin`
- `/admin/*`
- `/auth/callback`
- `/auth/confirm`
- `/api/*`
- `/legal/[slug]` placeholder routes until real page content exists.
- `/legal/plans/[slug]` unless intentionally treated as searchable legal content.

Robots should also disallow crawl for noisy/private route prefixes, but sensitive pages should use `noindex` or auth protection. Robots alone is not enough to remove a URL from search if Google discovers it elsewhere.

## 5. Missing Schema Opportunities

Add JSON-LD only for true, visible, and verifiable facts.

Recommended:

- `Organization`
  - Name: BitLink / BitLink Ltd.
  - URL: canonical production URL.
  - Logo: existing logo asset or future OG/logo asset.
  - Email/phone/contact point from footer/legal pages.
  - Registration number appears in legal pages: `341280188`.

- `WebSite`
  - Name and URL.
  - Do not add `SearchAction` unless the site has search.

- `Service` or `Product` with `Offer`
  - Use plan data from `src/lib/plans.ts`.
  - Plan pages can expose name, description, price, currency, and availability if accurate.
  - Avoid fake ratings/reviews.

- `BreadcrumbList`
  - Plan detail pages: Home > Plans > Plan.
  - Legal plan pages: Home > Plans > Plan > Contract.

- `LocalBusiness`
  - Only if the address in legal pages is a real public/customer-facing business address.
  - Current legal terms show `HaRashar Hirsch 4/1, Israel`; confirm before using LocalBusiness.

- `FAQPage`
  - Do not add yet. There is no visible FAQ content on public pages.

- `Article`
  - Not applicable. No blog/article routes currently exist.

## 6. Performance Issues

1. Public pages may be dynamic because auth is checked globally.
   - `src/components/layout/SiteHeader.tsx` calls Supabase auth from the root layout.
   - `src/lib/supabase/server.ts` reads cookies.
   - `middleware.ts` runs Supabase session refresh broadly.
   - Recommendation: keep public marketing pages as static/cacheable as possible and move auth-aware header behavior behind a narrower boundary if feasible.

2. Large image assets.
   - Several public assets are around 1.4MB to 1.5MB.
   - `bitlink-telecom-hero-v2.png` is preloaded at quality 90.
   - `logo-v2.png` is 982KB, which is high for a logo.
   - Recommendation: create optimized WebP/AVIF variants and a smaller logo asset. This can be done without changing visual design.

3. Global client JavaScript.
   - `src/components/brand/BrandMark.tsx` is a client component because of the hidden localStorage click behavior.
   - Since it is used in the global header/footer, that client logic ships broadly.
   - Recommendation: split static logo/link from the hidden interactive behavior if the feature is needed.

4. Framer Motion on above-the-fold homepage hero.
   - `src/components/marketing/LiquidHero.tsx` is client-side and imports `framer-motion`.
   - `PlanSelector` also uses Framer Motion.
   - Recommendation: keep animation budgets tight and measure real Lighthouse/Core Web Vitals after implementation.

5. Lint performance warning.
   - `src/components/checkout/CheckoutForm.tsx` synchronously calls `setState` in an effect based on localStorage.
   - Existing issue, not changed during audit.

## 7. Internal Linking Issues

1. Main navigation links only to:
   - `/plans`
   - `/refer`
   - `/support`

2. Footer links only to:
   - `/legal/terms`
   - `/legal/privacy`
   - `/legal/acceptable-use`
   - `/support`

3. Plan detail pages are reachable from plan selector/comparison components, but not directly from main navigation or footer.

4. No breadcrumbs are present.
   - Breadcrumb links and BreadcrumbList schema would help plan/legal hierarchy without changing the visual design if implemented as metadata/schema only. Visual breadcrumbs would be a front-end change and should be approved separately.

5. Important future SEO landing pages do not exist yet, so the current internal link graph is shallow.

## 8. Content Gaps

These are content/strategy gaps, not implementation changes for this audit:

1. Homepage is clear but broad.
   - It says "Israeli phone service made simple", but does not deeply target specific search intents like Israel eSIM, Israeli SIM card, student phone plans in Israel, kosher phone plans, or US number while in Israel.

2. Plan pages are useful but thin for organic intent.
   - Each plan page has plan description, included features, terms, and comparison link.
   - They could use stronger intent-specific copy later, but that would be a front-end/content change and was not done.

3. No FAQ pages or visible FAQ sections.
   - Common search questions around eSIM setup, porting, kosher phones, number add-ons, billing, roaming, and activation are not covered in indexable content.

4. No location/use-case pages.
   - If the target audience includes students, yeshiva/seminary students, olim, travelers, families, or English speakers in Israel, those pages do not exist.

5. Legal placeholder content.
   - `/legal/acceptable-use` is linked but not complete.
   - `PRODUCTION_TODO.md` also says legal placeholders need review.

6. Business facts need confirmation before schema.
   - Public business address.
   - Whether the address is customer-facing.
   - Exact legal name to use in schema.
   - Official logo/OG image.
   - SameAs profiles, if any.

## 9. Recommended New Landing Pages

Do not create these without business approval and real content. They are natural SEO opportunities based on the codebase and existing plan data:

| Proposed URL | Search intent | Suggested title tag | H1 | CTA |
| --- | --- | --- | --- | --- |
| `/israel-esim` | People looking for an eSIM in Israel | Israel eSIM Plans | Israel eSIM plans with human support | Choose a plan |
| `/israeli-phone-plans-for-students` | Students studying in Israel who need phone service | Israeli Phone Plans for Students | Israeli phone plans for students | Compare student plans |
| `/kosher-phone-plans-israel` | Kosher phone users looking for compliant service | Kosher Phone Plans in Israel | Kosher phone plans for Israel | View kosher plans |
| `/israel-sim-card` | People searching for SIM card options in Israel | Israel SIM Card Plans | Simple Israel SIM card plans | Choose your SIM plan |
| `/us-canada-number-in-israel` | Users who want family abroad to call locally | US and Canada Number Add-On in Israel | Add a US, Canadian, or UK number to your BitLink line | Add during checkout |
| `/support/esim-activation` | Support/how-to intent around eSIM setup | eSIM Activation Help | Help activating your BitLink eSIM | Contact support |
| `/support/number-porting` | Users who want to keep/port a number | Port Your Number to BitLink | Keep your number with guided porting support | Ask about porting |
| `/faq` | Branded and pre-sale questions | BitLink FAQ | BitLink questions, answered clearly | Compare plans |

Suggested outlines should be written after confirming target audience, target locations, and priority keywords. Avoid filler and avoid creating pages that duplicate each other.

## 10. Exact Files Planned To Modify If Implementation Is Approved

Backend/technical SEO only, with no visual/front-end layout changes:

- `src/lib/seo.ts` - new shared SEO constants/helpers for canonical URL, site name, public routes, metadata builders, and safe JSON-LD serialization.
- `src/app/layout.tsx` - improve global metadata, Twitter card defaults, canonical defaults where appropriate, and root Organization/WebSite JSON-LD.
- `src/app/sitemap.ts` - new dynamic sitemap containing only canonical public pages.
- `src/app/robots.ts` - new robots rules and sitemap reference.
- `next.config.ts` - canonical redirect policy if supported cleanly by this Next/Vercel setup.
- `middleware.ts` - consider narrowing auth middleware matcher to reduce public-page overhead, if safe after auth review.
- `src/app/page.tsx` - metadata/schema only if needed; no UI changes.
- `src/app/plans/page.tsx` - metadata/schema only.
- `src/app/plans/[slug]/page.tsx` - dynamic canonical, OG/Twitter, Product/Service/Offer schema.
- `src/app/support/page.tsx` - canonical, OG/Twitter, contact/support schema only.
- `src/app/refer/page.tsx` - canonical and OG/Twitter only.
- `src/app/legal/terms/page.tsx` - canonical/noindex decision and metadata only.
- `src/app/legal/privacy/page.tsx` - canonical and metadata only.
- `src/app/legal/[slug]/page.tsx` - noindex placeholders until real content exists.
- `src/app/legal/plans/[slug]/page.tsx` - noindex or exact legal metadata decision.
- `src/app/login/page.tsx` - noindex metadata.
- `src/app/signup/page.tsx` - noindex metadata.
- `src/app/checkout/page.tsx` - noindex/canonical metadata.
- `src/app/checkout/success/page.tsx` - noindex metadata.
- `src/app/checkout/cancel/page.tsx` - noindex metadata.
- `src/app/support/ticket/[number]/page.tsx` - noindex metadata at minimum.
- `src/app/account/layout.tsx` - noindex for account section.
- `src/app/admin/layout.tsx` - noindex for admin section.
- `public/assets/*` - optional optimized OG/logo assets only if approved; no visible UI change.

Files not planned for Phase 2 technical SEO unless separately approved:

- Visual component layout/styling files.
- Homepage copy rewrites.
- New landing page routes.
- New FAQ sections.

## Route Inventory

All page routes found:

- `/`
- `/account`
- `/account/activation`
- `/account/billing`
- `/account/lines`
- `/account/referrals`
- `/admin`
- `/admin/customers`
- `/admin/events`
- `/admin/lines`
- `/admin/lines/[id]`
- `/admin/orders`
- `/admin/plans`
- `/admin/provisioning`
- `/admin/referrals`
- `/admin/settings`
- `/admin/subscriptions`
- `/admin/support`
- `/admin/support/[ticketId]`
- `/admin/support/insights`
- `/admin/support/macros`
- `/admin/webhooks`
- `/checkout`
- `/checkout/cancel`
- `/checkout/success`
- `/email-signature`
- `/legal/[slug]`
- `/legal/plans/[slug]`
- `/legal/privacy`
- `/legal/terms`
- `/login`
- `/plans`
- `/plans/[slug]`
- `/refer`
- `/signup`
- `/support`
- `/support/ticket/[number]`

## Validation Notes From Phase 1

- `npm run typecheck`: passed.
- `npm run lint`: failed before any SEO changes.
  - Public/SEO relevant existing failures include unescaped text in `src/app/legal/terms/page.tsx` and `src/app/support/page.tsx`.
  - Performance/code-health warning in `src/components/checkout/CheckoutForm.tsx`.
  - Private/admin raw internal link warning in `src/app/admin/support/page.tsx`.
- No sitemap currently available to test.
- No robots file currently available to test.
- No JSON-LD currently available to validate.
- No Lighthouse run was performed during Phase 1 because no implementation was requested.

## Phase 2 Backend Implementation Update

Completed on 2026-06-22 after approval for backend-only SEO work. No visible front-end layout, styling, or copy changes were made.

Implemented:

- Added shared SEO helpers in `src/lib/seo.ts`.
- Added `/sitemap.xml` through `src/app/sitemap.ts`.
- Added `/robots.txt` through `src/app/robots.ts`.
- Added canonical metadata, Open Graph metadata, Twitter card metadata, and crawler directives for public pages.
- Added `Organization` and `WebSite` JSON-LD globally.
- Added plan `Service`/`Offer` JSON-LD and breadcrumb JSON-LD on plan detail pages.
- Added plans `ItemList` JSON-LD on `/plans`.
- Added `ContactPage` JSON-LD on `/support`.
- Added `noindex,nofollow` metadata to account, admin, auth, checkout, support ticket, email signature, legal placeholder, and plan-contract routes.
- Added a permanent `www.bitlink.co.il` to `bitlink.co.il` redirect in `next.config.ts`.

Files changed for Phase 2:

- `next.config.ts`
- `src/lib/seo.ts`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/page.tsx`
- `src/app/plans/page.tsx`
- `src/app/plans/[slug]/page.tsx`
- `src/app/support/page.tsx`
- `src/app/refer/page.tsx`
- `src/app/legal/terms/page.tsx`
- `src/app/legal/privacy/page.tsx`
- `src/app/legal/[slug]/page.tsx`
- `src/app/legal/plans/[slug]/page.tsx`
- `src/app/account/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/checkout/page.tsx`
- `src/app/checkout/success/page.tsx`
- `src/app/checkout/cancel/page.tsx`
- `src/app/support/ticket/[number]/page.tsx`
- `src/app/email-signature/page.tsx`

## Validation Checklist

- Sitemap works at `/sitemap.xml`: passed locally on `http://localhost:3021/sitemap.xml`.
- Robots works at `/robots.txt`: passed locally on `http://localhost:3021/robots.txt`.
- Metadata exists on all public SEO pages: implemented for `/`, `/plans`, `/plans/[slug]`, `/support`, `/refer`, `/legal/privacy`, and `/legal/terms`.
- Canonicals are correct: spot-checked `/plans/student-5g`, which emits `https://bitlink.co.il/plans/student-5g`.
- JSON-LD validates structurally in rendered HTML: implemented; should still be tested in Google Rich Results Test after deployment.
- Lighthouse SEO score target 95+: not run locally in this pass.
- No obvious mobile layout issues: no visible front-end changes were made.
- No duplicate H1 issues introduced: no heading/content changes were made.
- No important images missing alt text introduced: no image/rendered content changes were made.
- No private pages accidentally indexable: account/admin layouts and standalone private/transactional pages now emit `noindex,nofollow`.
- No spammy SEO tactics used: no keyword stuffing, fake reviews, hidden text, fake locations, or fake FAQ schema were added.
- TypeScript check: `npm run typecheck` passed.
- Production build: `npm run build` passed and generated static `/robots.txt` and `/sitemap.xml`.
- Lint: `npm run lint` still fails on pre-existing non-SEO issues documented above.

## Phase 3 Premium Content Implementation Update

Completed on 2026-06-22 after approval to add front-end SEO content while preserving the BitLink voice:

> Clear, calm, human, premium. Use exact telecom terms only where they help the customer understand the service. Never write for Google at the expense of trust.

Implemented:

- Added a shared public-content source in `src/lib/public-content.ts`.
- Added a reusable premium service-page layout in `src/components/marketing/ServiceLandingPage.tsx`.
- Added three high-intent public service pages:
  - `/israel-esim`
  - `/israeli-phone-plans-for-students`
  - `/kosher-phone-plans-israel`
- Added a concise visible FAQ page at `/faq`.
- Added FAQPage JSON-LD only on the visible FAQ page.
- Added Service + Breadcrumb JSON-LD for the new service pages.
- Added an understated homepage section linking to the new service paths.
- Added contextual plan-detail guidance and links to the relevant service guide, FAQ, and support.
- Added footer links under a quiet "Explore" group.
- Updated the sitemap to include the new public pages.

Validation:

- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm run lint`: still fails on the same pre-existing lint issues noted above; the new Phase 3 files did not introduce new lint failures.
- Local route checks passed on `http://localhost:3021`:
  - `/sitemap.xml` includes the four new public URLs.
  - `/israel-esim` emits title, canonical URL, Open Graph URL, and JSON-LD.
  - `/faq` emits title, canonical URL, visible FAQ content, and FAQPage JSON-LD.
  - `/` renders the new service-path section.
  - `/plans/student-5g` renders the added plan guidance links.
