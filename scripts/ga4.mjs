// BitLink - Google Analytics 4 CLI.
//
// This script uses the official Google Analytics Data API (GA4) to pull traffic,
// page, channel, and realtime reports, and to write a local Markdown summary.
// OAuth credentials and generated reports stay in git-ignored local directories.
//
// Setup instructions: GA4_CLI.md

import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { google } from 'googleapis';

const DEFAULT_PROPERTY_ID = '510449299';
const DEFAULT_CLIENT_FILE = '.seo/google-ga-oauth-client.json';
const DEFAULT_TOKEN_FILE = '.seo/google-ga-oauth-token.json';
const DEFAULT_REPORT_DIRECTORY = 'reports/analytics';
const OAUTH_SCOPES = ['https://www.googleapis.com/auth/analytics.readonly'];
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
BitLink Google Analytics 4 CLI

Usage:
  npm run ga4 -- <command> [options]

Commands:
  auth                    Authenticate the Google account that owns the GA4 property.
  overview [--days 28]    Sessions, users, engagement, and conversions for the period.
  pages [--days 28]       Top pages by views for the period.
  sources [--days 28]     Sessions by acquisition channel for the period.
  realtime                Active users on the site right now.
  ads-links               List Google Ads accounts linked to this GA4 property.
  report [--days 28]      Write a local Markdown performance report.
  help                    Show this help text.

Shared options:
  --days <number>         Number of complete days to query (default: 28).
  --limit <number>        Maximum rows to return (default: 25).
  --property <id>         Override GA4_PROPERTY_ID for one command.
  --output <path>         Override the report output file.

Examples:
  npm run ga4:auth
  npm run ga4:overview
  npm run ga4 -- pages --days 90 --limit 50
  npm run ga4:report

Setup instructions are in GA4_CLI.md.
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

function getPropertyId() {
  return getStringOption('property', process.env.GA4_PROPERTY_ID?.trim() || DEFAULT_PROPERTY_ID);
}

function getClientFile() {
  return resolveLocalPath(process.env.GA4_OAUTH_CLIENT_FILE?.trim() || DEFAULT_CLIENT_FILE);
}

function getTokenFile() {
  return resolveLocalPath(process.env.GA4_OAUTH_TOKEN_FILE?.trim() || DEFAULT_TOKEN_FILE);
}

function resolveLocalPath(filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

async function readJson(filePath, description) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      fail(`${description} was not found at ${filePath}. See GA4_CLI.md for setup.`);
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

async function getAuthenticatedClient() {
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
    scope: OAUTH_SCOPES,
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
      response.end('BitLink Analytics access is connected. You can close this tab.');
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

async function getAnalyticsData() {
  return google.analyticsdata({ version: 'v1beta', auth: await getAuthenticatedClient() });
}

async function getAnalyticsAdmin() {
  return google.analyticsadmin({ version: 'v1beta', auth: await getAuthenticatedClient() });
}

async function showAdsLinks() {
  const admin = await getAnalyticsAdmin();
  const property = getPropertyId();

  const { data } = await admin.properties.googleAdsLinks.list({
    parent: `properties/${property}`,
  });

  const links = data.googleAdsLinks ?? [];
  console.log(`\nGoogle Ads links for properties/${property}\n`);

  if (links.length === 0) {
    console.log('No Google Ads link found on this GA4 property yet.');
    return;
  }

  console.table(links.map((link) => ({
    'Ads Customer ID': link.customerId,
    'Personalized ads': link.adsPersonalizationEnabled ? 'enabled' : 'disabled',
    Created: link.createTime,
  })));
}

function getDateRange(days) {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const format = (date) => date.toISOString().slice(0, 10);
  return { startDate: format(start), endDate: format(end) };
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatDecimal(value, digits = 1) {
  return Number(value ?? 0).toFixed(digits);
}

function formatPercent(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`;
}

function formatSeconds(value) {
  return `${Number(value ?? 0).toFixed(0)}s`;
}

async function runReport({ dimensions = [], metrics, limit, orderBys }) {
  const days = getNumberOption('days', 28);
  const analyticsData = await getAnalyticsData();
  const property = getPropertyId();
  const range = getDateRange(days);

  const { data } = await analyticsData.properties.runReport({
    property: `properties/${property}`,
    requestBody: {
      dateRanges: [range],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit,
      orderBys,
    },
  });

  return { range, property, rows: data.rows ?? [], metricHeaders: data.metricHeaders ?? [] };
}

function rowValue(row, metricHeaders, name) {
  const index = metricHeaders.findIndex((header) => header.name === name);
  return index === -1 ? undefined : row.metricValues?.[index]?.value;
}

async function showOverview() {
  const { range, property, rows, metricHeaders } = await runReport({
    metrics: ['sessions', 'activeUsers', 'newUsers', 'engagementRate', 'averageSessionDuration', 'conversions'],
  });

  console.log(`\nOverview for properties/${property} (${range.startDate} to ${range.endDate})\n`);

  if (rows.length === 0) {
    console.log('No data returned. New GA4 properties can take 24-48 hours to start collecting data.');
    return;
  }

  const row = rows[0];
  console.table([{
    Sessions: formatNumber(rowValue(row, metricHeaders, 'sessions')),
    'Active users': formatNumber(rowValue(row, metricHeaders, 'activeUsers')),
    'New users': formatNumber(rowValue(row, metricHeaders, 'newUsers')),
    'Engagement rate': formatPercent(rowValue(row, metricHeaders, 'engagementRate')),
    'Avg. session duration': formatSeconds(rowValue(row, metricHeaders, 'averageSessionDuration')),
    Conversions: formatNumber(rowValue(row, metricHeaders, 'conversions')),
  }]);
}

async function showPages() {
  const limit = getNumberOption('limit', 25);
  const { range, property, rows, metricHeaders } = await runReport({
    dimensions: ['pagePath'],
    metrics: ['screenPageViews', 'sessions', 'averageSessionDuration'],
    limit,
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
  });

  console.log(`\nPages for properties/${property} (${range.startDate} to ${range.endDate})\n`);

  if (rows.length === 0) {
    console.log('No data returned. New GA4 properties can take 24-48 hours to start collecting data.');
    return;
  }

  console.table(rows.map((row) => ({
    Page: row.dimensionValues?.[0]?.value ?? '',
    Views: formatNumber(rowValue(row, metricHeaders, 'screenPageViews')),
    Sessions: formatNumber(rowValue(row, metricHeaders, 'sessions')),
    'Avg. duration': formatSeconds(rowValue(row, metricHeaders, 'averageSessionDuration')),
  })));
}

async function showSources() {
  const limit = getNumberOption('limit', 25);
  const { range, property, rows, metricHeaders } = await runReport({
    dimensions: ['sessionDefaultChannelGroup'],
    metrics: ['sessions', 'activeUsers', 'conversions'],
    limit,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  });

  console.log(`\nAcquisition channels for properties/${property} (${range.startDate} to ${range.endDate})\n`);

  if (rows.length === 0) {
    console.log('No data returned. New GA4 properties can take 24-48 hours to start collecting data.');
    return;
  }

  console.table(rows.map((row) => ({
    Channel: row.dimensionValues?.[0]?.value ?? '(unassigned)',
    Sessions: formatNumber(rowValue(row, metricHeaders, 'sessions')),
    'Active users': formatNumber(rowValue(row, metricHeaders, 'activeUsers')),
    Conversions: formatNumber(rowValue(row, metricHeaders, 'conversions')),
  })));
}

async function showRealtime() {
  const analyticsData = await getAnalyticsData();
  const property = getPropertyId();

  const { data } = await analyticsData.properties.runRealtimeReport({
    property: `properties/${property}`,
    requestBody: {
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      limit: getNumberOption('limit', 25),
    },
  });

  const rows = data.rows ?? [];
  console.log(`\nRealtime active users for properties/${property}\n`);

  if (rows.length === 0) {
    console.log('No active users right now.');
    return;
  }

  console.table(rows.map((row) => ({
    Page: row.dimensionValues?.[0]?.value ?? '(unknown)',
    'Active users': formatNumber(row.metricValues?.[0]?.value),
  })));
}

function markdownCell(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

async function writeReport() {
  const days = getNumberOption('days', 28);
  const limit = getNumberOption('limit', 25);

  const [overview, pages, sources] = await Promise.all([
    runReport({ metrics: ['sessions', 'activeUsers', 'newUsers', 'engagementRate', 'averageSessionDuration', 'conversions'] }),
    runReport({
      dimensions: ['pagePath'],
      metrics: ['screenPageViews', 'sessions', 'averageSessionDuration'],
      limit,
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    }),
    runReport({
      dimensions: ['sessionDefaultChannelGroup'],
      metrics: ['sessions', 'activeUsers', 'conversions'],
      limit,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    }),
  ]);

  const overviewRow = overview.rows[0];
  const date = new Date().toISOString().slice(0, 10);
  const defaultOutput = path.join(DEFAULT_REPORT_DIRECTORY, `ga4-${date}.md`);
  const outputFile = resolveLocalPath(getStringOption('output', defaultOutput));

  const pagesTable = pages.rows.length === 0
    ? '_No data returned for this range._'
    : [
        '| Page | Views | Sessions | Avg. duration |',
        '| --- | ---: | ---: | ---: |',
        ...pages.rows.map((row) => `| ${markdownCell(row.dimensionValues?.[0]?.value)} | ${formatNumber(rowValue(row, pages.metricHeaders, 'screenPageViews'))} | ${formatNumber(rowValue(row, pages.metricHeaders, 'sessions'))} | ${formatSeconds(rowValue(row, pages.metricHeaders, 'averageSessionDuration'))} |`),
      ].join('\n');

  const sourcesTable = sources.rows.length === 0
    ? '_No data returned for this range._'
    : [
        '| Channel | Sessions | Active users | Conversions |',
        '| --- | ---: | ---: | ---: |',
        ...sources.rows.map((row) => `| ${markdownCell(row.dimensionValues?.[0]?.value ?? '(unassigned)')} | ${formatNumber(rowValue(row, sources.metricHeaders, 'sessions'))} | ${formatNumber(rowValue(row, sources.metricHeaders, 'activeUsers'))} | ${formatNumber(rowValue(row, sources.metricHeaders, 'conversions'))} |`),
      ].join('\n');

  const report = `# BitLink GA4 Report

Generated: ${new Date().toISOString()}

Property: \`properties/${overview.property}\`

Range: ${overview.range.startDate} through ${overview.range.endDate}

## Overview

${overviewRow ? `- Sessions: ${formatNumber(rowValue(overviewRow, overview.metricHeaders, 'sessions'))}
- Active users: ${formatNumber(rowValue(overviewRow, overview.metricHeaders, 'activeUsers'))}
- New users: ${formatNumber(rowValue(overviewRow, overview.metricHeaders, 'newUsers'))}
- Engagement rate: ${formatPercent(rowValue(overviewRow, overview.metricHeaders, 'engagementRate'))}
- Avg. session duration: ${formatSeconds(rowValue(overviewRow, overview.metricHeaders, 'averageSessionDuration'))}
- Conversions: ${formatNumber(rowValue(overviewRow, overview.metricHeaders, 'conversions'))}` : '_No data returned for this range._'}

## Top Pages

${pagesTable}

## Acquisition Channels

${sourcesTable}

## Notes

- GA4 data can take 24-48 hours to appear for a newly created property.
- This report is generated locally and is intentionally excluded from git.
- Cross-reference with \`npm run seo:gsc:report\` to connect search queries to on-site engagement.
`;

  await mkdir(path.dirname(outputFile), { recursive: true });
  await writeFile(outputFile, report, 'utf8');
  console.log(`Wrote GA4 report to ${outputFile}`);
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
    case 'overview':
      await showOverview();
      return;
    case 'pages':
      await showPages();
      return;
    case 'sources':
      await showSources();
      return;
    case 'realtime':
      await showRealtime();
      return;
    case 'ads-links':
      await showAdsLinks();
      return;
    case 'report':
      await writeReport();
      return;
    default:
      fail(`Unknown command: ${command}. Run npm run ga4 -- help for available commands.`);
  }
}

main().catch((error) => {
  console.error(`\nGoogle Analytics command failed: ${error.message}`);
  process.exit(1);
});
