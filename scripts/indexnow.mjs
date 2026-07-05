#!/usr/bin/env node
/**
 * IndexNow submitter for BitLink.
 *
 * Reads the live sitemap and pushes every URL to api.indexnow.org, which
 * feeds Bing (and therefore ChatGPT search / Copilot) plus other IndexNow
 * participants. Run after deploying content changes:
 *
 *   npm run seo:indexnow            # submit all sitemap URLs
 *   npm run seo:indexnow -- <url>…  # submit specific URLs only
 *
 * The key file must stay hosted at https://www.bitlink.co.il/<KEY>.txt.
 */

const HOST = "www.bitlink.co.il";
const KEY = "2dd6ed6a505944367786a8629eb005c718b8cebeb04fc204";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

async function getSitemapUrls() {
  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: HTTP ${response.status}`);
  }
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function main() {
  const cliUrls = process.argv.slice(2).filter((arg) => arg.startsWith("http"));
  const urlList = cliUrls.length > 0 ? cliUrls : await getSitemapUrls();

  if (urlList.length === 0) {
    console.error("No URLs to submit.");
    process.exit(1);
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });

  // IndexNow returns 200 (ok) or 202 (accepted, key validation pending).
  if (response.status === 200 || response.status === 202) {
    console.log(`Submitted ${urlList.length} URL(s) to IndexNow (HTTP ${response.status}).`);
    for (const url of urlList) console.log(`  ${url}`);
  } else {
    console.error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
