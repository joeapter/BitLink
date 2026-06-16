#!/usr/bin/env node
// BitLink CDR relay — runs on VPS with whitelisted static IP.
//
// What it does (every 4 hours via cron):
//   1. Connect to Annatel FTP server
//   2. Download all .csv / .txt CDR files from the configured path
//   3. POST them to https://bitlink.co.il/api/cdrs/ingest
//   4. Move processed files to /processed subfolder to avoid re-sending
//
// Setup on VPS:
//   sudo apt install nodejs npm
//   npm install basic-ftp node-fetch   (node-fetch only if Node < 18)
//   cp cdr-relay.js /opt/bitlink/
//   cp .env /opt/bitlink/
//   chmod +x /opt/bitlink/cdr-relay.js
//   crontab -e
//     0 */4 * * * node /opt/bitlink/cdr-relay.js >> /var/log/bitlink-cdr.log 2>&1

'use strict';

const ftp = require('basic-ftp');
const { Writable } = require('stream');

// ── Config (edit these or set as env vars) ────────────────────────────────────

const CONFIG = {
  ftpHost:      process.env.FTP_HOST     || '',
  ftpPort:      parseInt(process.env.FTP_PORT || '21', 10),
  ftpUser:      process.env.FTP_USER     || '',
  ftpPass:      process.env.FTP_PASS     || '',
  ftpPath:      process.env.FTP_PATH     || '/cdrs',
  ftpSecure:    process.env.FTP_SECURE   === 'true',

  bitlinkUrl:   process.env.BITLINK_URL  || 'https://bitlink.co.il',
  ingestSecret: process.env.INGEST_SECRET || '',
};

// ── Load .env if present ──────────────────────────────────────────────────────

try {
  const fs = require('fs');
  const path = require('path');
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const [k, ...vParts] = line.split('=');
      if (k && vParts.length) process.env[k.trim()] = vParts.join('=').trim();
    }
    // Re-read config after env load
    Object.assign(CONFIG, {
      ftpHost:      process.env.FTP_HOST     || CONFIG.ftpHost,
      ftpPort:      parseInt(process.env.FTP_PORT || '21', 10),
      ftpUser:      process.env.FTP_USER     || CONFIG.ftpUser,
      ftpPass:      process.env.FTP_PASS     || CONFIG.ftpPass,
      ftpPath:      process.env.FTP_PATH     || CONFIG.ftpPath,
      ftpSecure:    process.env.FTP_SECURE   === 'true',
      bitlinkUrl:   process.env.BITLINK_URL  || CONFIG.bitlinkUrl,
      ingestSecret: process.env.INGEST_SECRET || CONFIG.ingestSecret,
    });
  }
} catch {}

// ── Validate ──────────────────────────────────────────────────────────────────

if (!CONFIG.ftpHost || !CONFIG.ftpUser || !CONFIG.ftpPass) {
  console.error('[CDR relay] FTP credentials not set — check .env file');
  process.exit(1);
}

if (!CONFIG.ingestSecret) {
  console.error('[CDR relay] INGEST_SECRET not set — refusing to run');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg, data) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`, data ? JSON.stringify(data) : '');
}

async function downloadFile(client, remotePath) {
  const chunks = [];
  const writable = new Writable({
    write(chunk, _enc, cb) { chunks.push(chunk); cb(); },
  });
  await client.downloadTo(writable, remotePath);
  return Buffer.concat(chunks).toString('utf8');
}

async function postToIngest(files) {
  const url = `${CONFIG.bitlinkUrl}/api/cdrs/ingest`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cdrs-secret': CONFIG.ingestSecret,
    },
    body: JSON.stringify({ files }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Ingest returned ${res.status}: ${JSON.stringify(body)}`);
  return body;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  log('CDR relay starting');

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

    log('FTP connected', { host: CONFIG.ftpHost });

    const list = await client.list(CONFIG.ftpPath);
    const cdrFiles = list.filter(
      (e) => e.name.endsWith('.csv') || e.name.endsWith('.txt') || e.name.endsWith('.cdr')
    );

    if (!cdrFiles.length) {
      log('No CDR files found — nothing to do');
      client.close();
      return;
    }

    log(`Found ${cdrFiles.length} CDR file(s)`);

    const files = [];
    for (const entry of cdrFiles) {
      const remotePath = `${CONFIG.ftpPath}/${entry.name}`;
      try {
        const content = await downloadFile(client, remotePath);
        files.push({ name: entry.name, content });
        log(`Downloaded: ${entry.name} (${content.length} bytes)`);
      } catch (err) {
        log(`Failed to download ${entry.name}: ${err.message}`);
      }
    }

    client.close();

    if (!files.length) {
      log('No files downloaded successfully');
      return;
    }

    // POST to BitLink
    const result = await postToIngest(files);
    log('Ingest complete', result);

  } catch (err) {
    client.close();
    log(`CDR relay failed: ${err.message}`);
    process.exit(1);
  }
}

run();
