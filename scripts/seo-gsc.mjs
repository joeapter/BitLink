// BitLink - Google Search Console CLI.
//
// This script uses the official Google Search Console API to submit the sitemap,
// inspect URLs, retrieve performance data, and create a local Markdown report.
// OAuth credentials and generated reports stay in git-ignored local directories.
//
// Setup instructions: SEO_CLI.md

import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { google } from 'googleapis';

const DEFAULT_SITE_URL = 'https://www.bitlink.co.il/';
const DEFAULT_SITEMAP_URL = 'https://www.bitlink.co.il/sitemap.xml';
const DEFAULT_CLIENT_FILE = '.seo/google-oauth-client.json';
const DEFAULT_TOKEN_FILE = '.seo/google-oauth-token.json';
const DEFAULT_REPORT_DIRECTORY = 'reports/seo';
const OAUTH_SCOPE = 'https://www.googleapis.com/auth/webmasters';
const GCLOUD_SCOPES = `https://www.googleapis.com/auth/cloud-platform,${OAUTH_SCOPE}`;
const CALLBACK_PATH = '/oauth2callback';

const [command = 'help', ...rawArgs] = process.argv.slice(2);
const { options, positionals } = parseArgs(rawArgs);

function parseArgs(args) {
  const options = {};
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (!argument.startsWith('--')) {
      positionals.push(argument);
      continue;
    }

    const [name, inlineValue] = argument.slice(2).split('=', 2);
    if (!name) fail('Option names must follow the --name format.');

    if (inlineValue !== undefined) {
      options[name] = inlineValue;
      continue;
    }

    const nextArgument = args[index + 1];
    if (nextArgument && !nextArgument.startsWith('--')) {
      options[name] = nextArgument;
      index += 1;
    } else {
      options[name] = true;
    }
  }

  return { options, positionals };
}

function fail(message) {
  console.error(`\nError: ${message}`);
  process.exit(1);
}

function printHelp() {
  console.log(`
BitLink Google Search Console CLI

Usage:
  npm run seo:gsc -- <command> [options]

Commands:
  auth                         Authenticate the Google account that owns the property.
  properties                   List Search Console properties available to that account.
  sitemaps                     List submitted sitemaps for the configured property.
  submit-sitemap               Submit the configured sitemap to Google Search Console.
  queries [--days 28]          List top search queries by clicks.
  pages [--days 28]            List top pages by clicks.
  inspect --url <url>          Inspect Google's index status for one URL.
  report [--days 28]           Write a local Markdown performance report.
  help                         Show this help text.

Shared options:
  --days <number>              Number of complete days to query (default: 28).
  --limit <number>             Maximum query/page rows to return (default: 25; report: 100).
  --site <property>            Override GSC_SITE_URL for one command.
  --sitemap <url>              Override the sitemap URL for one command.
  --output <path>              Override the report output file.

Examples:
  npm run seo:gsc:auth
  npm run seo:gsc:submit-sitemap
  npm run seo:gsc -- queries --days 28 --limit 50
  npm run seo:gsc -- inspect --url https://www.bitlink.co.il/israel-esim
  npm run seo:gsc:report

Setup instructions are in SEO_CLI.md.
`);
}

function getStringOption(name, fallback) {
  const value = options[name];
  if (value === undefined) return fallback;
  if (value === true || !String(value).trim()) fail(`--${name} requires a value.`);
  return String(value).trim();
}

function getNumberOption(name, fallback, min = 1) {
  const value = options[name];
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    fail(`--${name} must be an integer of at least ${min}.`);
  }
  return parsed;
}

function getSiteUrl() {
  return getStringOption('site', process.env.GSC_SITE_URL?.trim() || DEFAULT_SITE_URL);
}

function getAuthMode() {
  const mode = (process.env.GSC_AUTH_MODE?.trim() || 'gcloud').toLowerCase();
  if (mode !== 'gcloud' && mode !== 'oauth') {
    fail('GSC_AUTH_MODE must be either gcloud or oauth.');
  }
  return mode;
}

function getSitemapUrl() {
  return getStringOption('sitemap', process.env.GSC_SITEMAP_URL?.trim() || DEFAULT_SITEMAP_URL);
}

function getClientFile() {
  return resolveLocalPath(process.env.GSC_OAUTH_CLIENT_FILE?.trim() || DEFAULT_CLIENT_FILE);
}

function getTokenFile() {
  return resolveLocalPath(process.env.GSC_OAUTH_TOKEN_FILE?.trim() || DEFAULT_TOKEN_FILE);
}

function resolveLocalPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

async function readJson(filePath, description) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      fail(`${description} was not found at ${filePath}. See SEO_CLI.md for setup.`);
    }
    fail(`Could not read ${description}: ${error.message}`);
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function getOAuthConfiguration() {
  const credentials = await readJson(getClientFile(), 'Google OAuth client credentials');
  const configuration = credentials.installed ?? credentials.web;

  if (!configuration?.client_id || !configuration?.client_secret) {
    fail('OAuth client JSON must contain an installed or web client with client_id and client_secret.');
  }

  return configuration;
}

function createOAuthClient(configuration, redirectUri) {
  return new google.auth.OAuth2(configuration.client_id, configuration.client_secret, redirectUri);
}

async function getOAuthAuthenticatedClient() {
  const configuration = await getOAuthConfiguration();
  const tokenFile = getTokenFile();
  const token = await readJson(tokenFile, 'Google OAuth token');
  const client = createOAuthClient(configuration, 'http://127.0.0.1');
  client.setCredentials(token);

  client.on('tokens', (tokens) => {
    const updatedToken = { ...client.credentials, ...tokens };
    writeJson(tokenFile, updatedToken).catch((error) => {
      console.error(`Warning: could not refresh the local OAuth token: ${error.message}`);
    });
  });

  return client;
}

function getGcloudExecutable() {
  if (process.env.GCLOUD_EXECUTABLE?.trim()) return process.env.GCLOUD_EXECUTABLE.trim();

  const homebrewGcloud = '/opt/homebrew/share/google-cloud-sdk/bin/gcloud';
  return existsSync(homebrewGcloud) ? homebrewGcloud : 'gcloud';
}

async function getAuthenticatedClient() {
  if (getAuthMode() === 'oauth') return getOAuthAuthenticatedClient();

  try {
    const auth = new google.auth.GoogleAuth({ scopes: [OAUTH_SCOPE] });
    return await auth.getClient();
  } catch (error) {
    fail(`Google Cloud credentials are not configured. Run: npm run seo:gsc:auth\n${error.message}`);
  }
}

async function getSearchConsole() {
  return google.searchconsole({ version: 'v1', auth: await getAuthenticatedClient() });
}

function openBrowser(url) {
  const command = process.platform === 'darwin'
    ? { executable: 'open', arguments: [url] }
    : process.platform === 'win32'
      ? { executable: 'cmd', arguments: ['/c', 'start', '', url] }
      : { executable: 'xdg-open', arguments: [url] };

  const child = spawn(command.executable, command.arguments, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function authenticate() {
  if (getAuthMode() === 'gcloud') {
    await new Promise((resolve, reject) => {
      const child = spawn(getGcloudExecutable(), [
        'auth',
        'application-default',
        'login',
        '--scopes',
        GCLOUD_SCOPES,
      ], { stdio: 'inherit' });

      child.once('error', () => {
        reject(new Error('Google Cloud CLI was not found. Install gcloud or set GCLOUD_EXECUTABLE.'));
      });
      child.once('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`gcloud authentication exited with code ${code}.`));
      });
    });
    console.log('Google Cloud Application Default Credentials are ready for the Search Console CLI.');
    return;
  }

  const configuration = await getOAuthConfiguration();
  const server = createServer();

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    fail('Could not open a local OAuth callback server.');
  }

  const redirectUri = `http://127.0.0.1:${address.port}${CALLBACK_PATH}`;
  const client = createOAuthClient(configuration, redirectUri);
  const authorizationUrl = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [OAUTH_SCOPE],
  });

  console.log('Opening Google authorization in your browser.');
  console.log(`If it does not open, visit:\n${authorizationUrl}\n`);
  openBrowser(authorizationUrl);

  const code = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for Google authorization. Run the auth command again.'));
    }, 5 * 60 * 1000);

    server.on('request', (request, response) => {
      const callbackUrl = new URL(request.url, redirectUri);

      if (callbackUrl.pathname !== CALLBACK_PATH) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found.');
        return;
      }

      const error = callbackUrl.searchParams.get('error');
      const authorizationCode = callbackUrl.searchParams.get('code');

      if (error || !authorizationCode) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Google authorization was not completed. You can close this tab and try again.');
        clearTimeout(timeout);
        reject(new Error(error ? `Google authorization failed: ${error}` : 'Google did not return an authorization code.'));
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('BitLink Search Console access is connected. You can close this tab.');
      clearTimeout(timeout);
      resolve(authorizationCode);
    });
  }).finally(() => {
    server.close();
  });

  const { tokens } = await client.getToken(code);
  if (!tokens.refresh_token) {
    fail('Google did not return a refresh token. Revoke this app access in your Google Account and run auth again.');
  }

  await writeJson(getTokenFile(), tokens);
  console.log(`Authenticated. Local OAuth token saved to ${getTokenFile()}`);
}

function getDateRange(days) {
  const end = new Date();
  // Search Console data is not complete for the most recent few days.
  end.setUTCDate(end.getUTCDate() - 3);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const format = (date) => date.toISOString().slice(0, 10);
  return { startDate: format(start), endDate: format(end) };
}

async function fetchAnalytics(dimensions, { days, limit }) {
  const searchConsole = await getSearchConsole();
  const siteUrl = getSiteUrl();
  const range = getDateRange(days);
  const { data } = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate: range.startDate,
      endDate: range.endDate,
      dimensions,
      rowLimit: limit,
      dataState: 'final',
    },
  });

  return { range, rows: data.rows ?? [], siteUrl };
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value ?? 0);
}

function formatPercent(value) {
  return `${((value ?? 0) * 100).toFixed(1)}%`;
}

function formatPosition(value) {
  return Number(value ?? 0).toFixed(1);
}

function analyticsTable(rows, dimensionLabel) {
  return rows.map((row) => ({
    [dimensionLabel]: row.keys?.[0] ?? '',
    Clicks: formatNumber(row.clicks),
    Impressions: formatNumber(row.impressions),
    CTR: formatPercent(row.ctr),
    Position: formatPosition(row.position),
  }));
}

function markdownCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function markdownAnalyticsTable(rows, dimensionLabel) {
  if (rows.length === 0) return '_No data returned for this range._';

  const lines = [
    `| ${dimensionLabel} | Clicks | Impressions | CTR | Position |`,
    '| --- | ---: | ---: | ---: | ---: |',
  ];

  for (const row of rows) {
    lines.push(`| ${markdownCell(row.keys?.[0])} | ${formatNumber(row.clicks)} | ${formatNumber(row.impressions)} | ${formatPercent(row.ctr)} | ${formatPosition(row.position)} |`);
  }

  return lines.join('\n');
}

function sumMetric(rows, metric) {
  return rows.reduce((total, row) => total + (row[metric] ?? 0), 0);
}

async function listProperties() {
  const searchConsole = await getSearchConsole();
  const { data } = await searchConsole.sites.list();
  const properties = data.siteEntry ?? [];

  if (properties.length === 0) {
    console.log('No Search Console properties are available to this Google account.');
    return;
  }

  console.table(properties.map((property) => ({
    Property: property.siteUrl,
    Permission: property.permissionLevel,
  })));
}

async function listSitemaps() {
  const searchConsole = await getSearchConsole();
  const siteUrl = getSiteUrl();
  const { data } = await searchConsole.sitemaps.list({ siteUrl });
  const sitemaps = data.sitemap ?? [];

  if (sitemaps.length === 0) {
    console.log(`No sitemaps are currently submitted for ${siteUrl}.`);
    return;
  }

  console.table(sitemaps.map((sitemap) => ({
    Sitemap: sitemap.path,
    Submitted: sitemap.lastSubmitted,
    Downloaded: sitemap.lastDownloaded,
    Errors: sitemap.errors ?? 0,
    Warnings: sitemap.warnings ?? 0,
  })));
}

async function submitSitemap() {
  const searchConsole = await getSearchConsole();
  const siteUrl = getSiteUrl();
  const sitemapUrl = getSitemapUrl();
  await searchConsole.sitemaps.submit({ siteUrl, feedpath: sitemapUrl });
  console.log(`Submitted ${sitemapUrl} for ${siteUrl}.`);
}

async function listAnalytics(dimension, label) {
  const days = getNumberOption('days', 28);
  const limit = getNumberOption('limit', 25);
  const { range, rows, siteUrl } = await fetchAnalytics([dimension], { days, limit });

  console.log(`\n${label} for ${siteUrl} (${range.startDate} to ${range.endDate})\n`);
  if (rows.length === 0) {
    console.log('No data returned. New properties can take time to collect Search Console data.');
    return;
  }

  console.table(analyticsTable(rows, label.slice(0, -1)));
}

async function inspectUrl() {
  const url = getStringOption('url', positionals[0]);
  if (!url) {
    fail('Provide the page to inspect: npm run seo:gsc -- inspect --url https://www.bitlink.co.il/israel-esim');
  }

  const searchConsole = await getSearchConsole();
  const siteUrl = getSiteUrl();
  const { data } = await searchConsole.urlInspection.index.inspect({
    requestBody: {
      inspectionUrl: url,
      languageCode: 'en-US',
      siteUrl,
    },
  });
  const status = data.inspectionResult?.indexStatusResult;

  if (!status) {
    console.log(`Google returned no inspection status for ${url}.`);
    return;
  }

  console.table([{
    URL: url,
    Verdict: status.verdict,
    Coverage: status.coverageState,
    Indexing: status.indexingState,
    Robots: status.robotsTxtState,
    Fetch: status.pageFetchState,
    'Last crawl': status.lastCrawlTime,
    'Google canonical': status.googleCanonical,
    'User canonical': status.userCanonical,
  }]);
}

async function writeReport() {
  const days = getNumberOption('days', 28);
  const limit = getNumberOption('limit', 100);
  const [{ range, rows: queries, siteUrl }, { rows: pages }] = await Promise.all([
    fetchAnalytics(['query'], { days, limit }),
    fetchAnalytics(['page'], { days, limit }),
  ]);

  const opportunities = queries
    .filter((row) => row.impressions >= 10 && row.position >= 8 && row.position <= 20)
    .sort((first, second) => second.impressions - first.impressions)
    .slice(0, 15);
  const lowCtr = queries
    .filter((row) => row.impressions >= 20 && row.ctr < 0.02)
    .sort((first, second) => second.impressions - first.impressions)
    .slice(0, 15);

  const date = new Date().toISOString().slice(0, 10);
  const defaultOutput = path.join(DEFAULT_REPORT_DIRECTORY, `search-console-${date}.md`);
  const outputFile = resolveLocalPath(getStringOption('output', defaultOutput));
  const report = `# BitLink Search Console Report

Generated: ${new Date().toISOString()}

Property: \`${siteUrl}\`

Range: ${range.startDate} through ${range.endDate}

## Summary

- Query rows returned: ${formatNumber(queries.length)}
- Page rows returned: ${formatNumber(pages.length)}
- Clicks across reported query rows: ${formatNumber(sumMetric(queries, 'clicks'))}
- Impressions across reported query rows: ${formatNumber(sumMetric(queries, 'impressions'))}

## Top Queries

${markdownAnalyticsTable(queries.slice(0, 25), 'Query')}

## Top Pages

${markdownAnalyticsTable(pages.slice(0, 25), 'Page')}

## Near-Page-One Opportunities

Queries with at least 10 impressions and average position 8 through 20. Strengthen the matching page with useful detail, internal links, and legitimate external mentions.

${markdownAnalyticsTable(opportunities, 'Query')}

## High-Impression, Low-CTR Queries

Queries with at least 20 impressions and CTR below 2%. Review the matching page's title, description, and search intent before changing copy.

${markdownAnalyticsTable(lowCtr, 'Query')}

## Notes

- Search Console data is delayed and may be sparse for a newly verified property.
- This report is generated locally and is intentionally excluded from git.
- Do not treat average position as an exact rank for every searcher or device.
`;

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, report, 'utf8');
  console.log(`Wrote Search Console report to ${outputFile}`);
}

async function main() {
  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      return;
    case 'auth':
      await authenticate();
      return;
    case 'properties':
      await listProperties();
      return;
    case 'sitemaps':
      await listSitemaps();
      return;
    case 'submit-sitemap':
      await submitSitemap();
      return;
    case 'queries':
      await listAnalytics('query', 'Queries');
      return;
    case 'pages':
      await listAnalytics('page', 'Pages');
      return;
    case 'inspect':
      await inspectUrl();
      return;
    case 'report':
      await writeReport();
      return;
    default:
      fail(`Unknown command: ${command}. Run npm run seo:gsc -- help for available commands.`);
  }
}

main().catch((error) => {
  console.error(`\nGoogle Search Console command failed: ${error.message}`);
  process.exit(1);
});
