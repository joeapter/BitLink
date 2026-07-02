# Google Analytics 4 CLI

This local CLI connects BitLink to the official Google Analytics Data API (GA4). It can pull a traffic overview, top pages, acquisition channels, realtime active users, and generate a private Markdown report.

It uses its own OAuth client rather than the shared `gcloud` CLI client, because Google blocks that shared client from requesting the Analytics scope on most accounts (`This app is blocked` — this is a Google policy, not an account problem).

## One-time setup

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) for the project you already use for the Search Console CLI (`bitlink-seo-...`).
2. **Enable the API** (if not already): APIs & Services → Library → search "Google Analytics Data API" → Enable.
3. **Configure the OAuth consent screen** (APIs & Services → OAuth consent screen), if you haven't already for this project:
   - User type: External.
   - App name: anything (e.g. "BitLink Local Tools").
   - Add your own Google account under **Test users**. This is the step that avoids the "app is blocked" / verification wall — unverified apps work fine for accounts listed as test users.
4. **Create the OAuth client** (APIs & Services → Credentials → Create Credentials → OAuth client ID):
   - Application type: **Desktop app**.
   - Name: anything (e.g. "BitLink GA4 CLI").
   - Download the JSON.
5. Save the downloaded file to:

   ```text
   .seo/google-ga-oauth-client.json
   ```

   (The `.seo/` directory is git-ignored — never commit this file.)

6. Confirm your Google account has at least **Viewer** access on the GA4 property itself (Analytics → Admin → Property Access Management). If you created the property, you already have this.

7. Authenticate once. A browser window opens so you can grant access:

   ```bash
   npm run ga4:auth
   ```

## Commands

```bash
# Traffic overview: sessions, users, engagement, conversions.
npm run ga4:overview

# Top pages by views.
npm run ga4:pages

# Sessions by acquisition channel (organic search, direct, referral, etc.).
npm run ga4:sources

# Active users on the site right now.
npm run ga4:realtime

# Pass options through the base command for more detail.
npm run ga4 -- overview --days 90
npm run ga4 -- pages --days 90 --limit 50

# Generate a private Markdown report.
npm run ga4:report
```

Reports are written under `reports/analytics/`, which is git-ignored.

## Cross-referencing with Search Console

Run `npm run seo:gsc:report` alongside `npm run ga4:report` to connect search queries/impressions (Search Console) with what happens after the click (GA4 sessions, engagement, conversions) for the same pages.

## Notes

- New GA4 properties can take 24–48 hours to start returning data.
- `GA4_PROPERTY_ID` defaults to the BitLink property; override via `.env.local` or `--property` if you ever point this at a different property.

Google references:

- [Analytics Data API (GA4)](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [Dimensions & metrics reference](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
