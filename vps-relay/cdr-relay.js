#!/usr/bin/env node
// BitLink CDR relay — runs on VPS with whitelisted static IP (46.62.228.60).
//
// What it does (every 4 hours via cron):
//   1. Connect to Annatel FTP server (vault.annatel.net)
//   2. List .csv.gz files in the root directory
//   3. Skip files already recorded in processed.json (dedup)
//   4. Download, decompress (gzip), and POST CSV content to /api/cdrs/ingest
//   5. Record processed filenames so they are never re-sent
//
// Cron (on VPS):
//   0 */4 * * * cd /opt/bitlink && node cdr-relay.js >> /var/log/bitlink-cdr.log 2>&1

'use strict';

const ftp  = require('basic-ftp');
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');
const { Writable, pipeline } = require('stream');
const { promisify } = require('util');
const pipelineAsync = promisify(pipeline);

// ── Load .env ─────────────────────────────────────────────────────────────────

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0 && !line.startsWith('#')) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k) process.env[k] = v;
    }
  }
}

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG = {
  ftpHost:      process.env.FTP_HOST      || '',
  ftpPort:      parseInt(process.env.FTP_PORT || '21', 10),
  ftpUser:      process.env.FTP_USER      || '',
  ftpPass:      process.env.FTP_PASS      || '',
  ftpPath:      process.env.FTP_PATH      || '/',
  ftpSecure:    process.env.FTP_SECURE    === 'true',
  bitlinkUrl:   process.env.BITLINK_URL   || 'https://bitlink.co.il',
  ingestSecret: process.env.INGEST_SECRET || '',
};

const PROCESSED_FILE = path.join(__dirname, 'processed.json');

// ── Validate ──────────────────────────────────────────────────────────────────

if (!CONFIG.ftpHost || !CONFIG.ftpUser || !CONFIG.ftpPass) {
  console.error('[CDR relay] FTP credentials not set — check .env');
  process.exit(1);
}
if (!CONFIG.ingestSecret) {
  console.error('[CDR relay] INGEST_SECRET not set — refusing to run');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}${data ? ' ' + JSON.stringify(data) : ''}`);
}

function loadProcessed() {
  try { return new Set(JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'))); }
  catch { return new Set(); }
}

function saveProcessed(set) {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify([...set], null, 2));
}

async function downloadBuffer(client, remotePath) {
  const chunks = [];
  const writable = new Writable({ write(chunk, _enc, cb) { chunks.push(chunk); cb(); } });
  await client.downloadTo(writable, remotePath);
  return Buffer.concat(chunks);
}

async function decompressGzip(buf) {
  return new Promise((resolve, reject) => {
    zlib.gunzip(buf, (err, result) => err ? reject(err) : resolve(result));
  });
}

async function postToIngest(files) {
  const url = `${CONFIG.bitlinkUrl}/api/cdrs/ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-cdrs-secret': CONFIG.ingestSecret },
    body: JSON.stringify({ files }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Ingest returned ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  log('CDR relay starting', { ftpHost: CONFIG.ftpHost, ftpPath: CONFIG.ftpPath });

  const processed = loadProcessed();
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host: CONFIG.ftpHost,
      port: CONFIG.ftpPort,
      user: CONFIG.ftpUser,
      password: CONFIG.ftpPass,
      secure: CONFIG.ftpSecure,
    });

    log('FTP connected');

    const list = await client.list(CONFIG.ftpPath);

    // Match cdr_bitlink_*.csv.gz and cdr_incoming_bitlink_*.csv.gz
    const cdrFiles = list.filter(
      (e) => (e.name.endsWith('.csv.gz') || e.name.endsWith('.csv')) &&
             e.name.startsWith('cdr_') &&
             !processed.has(e.name)
    );

    if (!cdrFiles.length) {
      log('No new CDR files — nothing to do');
      client.close();
      return;
    }

    log(`Found ${cdrFiles.length} new CDR file(s) to process`);

    const files = [];
    for (const entry of cdrFiles) {
      const ftpRoot = CONFIG.ftpPath.endsWith('/') ? CONFIG.ftpPath : CONFIG.ftpPath + '/';
      const remotePath = `${ftpRoot}${entry.name}`;
      try {
        const buf = await downloadBuffer(client, remotePath);
        let content;
        if (entry.name.endsWith('.gz')) {
          const decompressed = await decompressGzip(buf);
          content = decompressed.toString('utf8');
          log(`Downloaded + decompressed: ${entry.name} (${content.length} chars)`);
        } else {
          content = buf.toString('utf8');
          log(`Downloaded: ${entry.name} (${content.length} chars)`);
        }
        files.push({ name: entry.name, content });
      } catch (err) {
        log(`Failed to download ${entry.name}: ${err.message}`);
      }
    }

    client.close();

    if (!files.length) {
      log('No files downloaded successfully');
      return;
    }

    const result = await postToIngest(files);
    log('Ingest complete', result);

    // Mark all successfully sent files as processed
    for (const f of files) processed.add(f.name);
    saveProcessed(processed);
    log(`Marked ${files.length} file(s) as processed`);

  } catch (err) {
    try { client.close(); } catch {}
    log(`CDR relay failed: ${err.message}`);
    process.exit(1);
  }
}

run();
