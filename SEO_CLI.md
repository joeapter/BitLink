# Google Search Console CLI

This local CLI connects BitLink to the official Google Search Console API. It can submit the sitemap, inspect page indexing status, read query and page performance, and generate a private weekly report.

It does not automate general-purpose indexing requests or create backlinks. Google only permits its Indexing API for specific job posting and livestream pages, and legitimate authority must come from real references, partners, and useful content.

## One-time setup

1. Verify the Search Console URL-prefix property `https://www.bitlink.co.il/` with the same Google account used below.
2. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and initialize it:

   ```bash
   gcloud init
   gcloud services enable searchconsole.googleapis.com
   ```

3. Confirm `.env.local` uses the default Google Cloud authentication mode:

   ```text
   GSC_SITE_URL=https://www.bitlink.co.il/
   GSC_AUTH_MODE=gcloud
   ```

4. Authenticate once. A browser window opens so you can grant the verified Google account Search Console access:

   ```bash
   npm run seo:gsc:auth
   gcloud auth application-default set-quota-project "$(gcloud config get-value project)"
   ```

The quota-project command is required for the Search Console API to use local Application Default Credentials. The Google Cloud CLI stores those credentials outside this repository. Do not set `GOOGLE_APPLICATION_CREDENTIALS` for this workflow.

## OAuth file fallback

Use this only when Application Default Credentials are not suitable. Set `GSC_AUTH_MODE=oauth`, then create a **Desktop app** OAuth client in Google Cloud Console and place the downloaded JSON here:

```text
.seo/google-oauth-client.json
```

Run `npm run seo:gsc:auth` to save the local refresh token. The `.seo/` directory is git-ignored.

## Commands

```bash
# Confirm this Google account can see the verified property.
npm run seo:gsc:properties

# Submit the live sitemap.
npm run seo:gsc:submit-sitemap

# List current sitemap processing status.
npm run seo:gsc:sitemaps

# See search queries and pages for the last 28 complete days.
npm run seo:gsc:queries
npm run seo:gsc:pages

# Pass options through the base command for more detail.
npm run seo:gsc -- queries --days 90 --limit 100
npm run seo:gsc -- pages --days 90 --limit 100

# Inspect one canonical public URL.
npm run seo:gsc -- inspect --url https://www.bitlink.co.il/israel-esim

# Generate a private Markdown report.
npm run seo:gsc:report
```

Reports are written under `reports/seo/`, which is git-ignored.

## Weekly workflow

1. Run `npm run seo:gsc:report`.
2. Look at **Near-Page-One Opportunities** for queries averaging positions 8 through 20.
3. Look at **High-Impression, Low-CTR Queries** before changing title or description copy.
4. Strengthen only the relevant page with useful, premium customer-facing information and contextual internal links.
5. Seek legitimate links from organizations already useful to the matching audience; do not buy links or publish keyword-stuffed pages.

## Domain property

The default setup matches the URL-prefix property visible in Search Console. If you later verify a Domain property, set this instead:

```text
GSC_SITE_URL=sc-domain:bitlink.co.il
```

Google references:

- [Search Console API](https://developers.google.com/webmaster-tools)
- [Search Analytics query API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Sitemaps API](https://developers.google.com/webmaster-tools/v1/sitemaps)
- [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect)
