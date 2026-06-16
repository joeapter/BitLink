# BitLink CDR Relay

Tiny Node.js script that runs on a VPS with a static IP. It pulls CDR files
from Annatel's FTP server every 4 hours and forwards them to the BitLink API.

## VPS setup (10 minutes)

### 1. Get a VPS
Hetzner CX22 — €3.29/month, ARM64, fixed IP.
Sign up at hetzner.com → Cloud → Create server → CX22 → Ubuntu 24.04.

### 2. SSH in and install Node
```bash
ssh root@<your-vps-ip>
apt update && apt install -y nodejs npm
node --version   # should be 18+
```

### 3. Copy the relay files to the VPS
From your local machine:
```bash
scp vps-relay/cdr-relay.js vps-relay/.env.example root@<vps-ip>:/opt/bitlink/
```

### 4. Configure credentials on the VPS
```bash
cp /opt/bitlink/.env.example /opt/bitlink/.env
nano /opt/bitlink/.env
```
Fill in FTP_HOST, FTP_USER, FTP_PASS from Ruben, and set INGEST_SECRET to match
what's in Vercel's CDRS_INGEST_SECRET env var.

### 5. Install dependencies
```bash
cd /opt/bitlink && npm install basic-ftp
```

### 6. Test it manually
```bash
node /opt/bitlink/cdr-relay.js
```
You should see `CDR relay starting` then file download logs.

### 7. Set up the cron (runs every 4 hours)
```bash
crontab -e
```
Add this line:
```
0 */4 * * * node /opt/bitlink/cdr-relay.js >> /var/log/bitlink-cdr.log 2>&1
```

### 8. Give Ruben the VPS IP to whitelist
```bash
curl -4 ifconfig.me
```
Email that IP to Ruben at Annatel.

## Updating the CDR column format
Once Annatel provides the actual CDR file format, update the `parseLine()`
function in `src/app/api/cdrs/ingest/route.ts` on the BitLink app — not
in this relay script. The relay just forwards raw file content.
