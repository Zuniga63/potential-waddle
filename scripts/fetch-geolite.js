/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * fetch-geolite.js — boot-time GeoLite2-City download (EVENT-03).
 *
 * Runs BEFORE `node dist/main` (Railway start command:
 *   `node scripts/fetch-geolite.js && node dist/main`).
 *
 * Fail-soft by design (Pitfall 4): this script ALWAYS exits 0. If MaxMind
 * credentials are absent or the download/extract fails, it logs and returns so
 * the app still boots — GeoIpService then degrades to all-null geo. It NEVER
 * blocks boot.
 *
 * Mechanism: Basic-Auth GET against MaxMind's direct download endpoint
 *   https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz
 * (account id : license key), stream to a temp .tar.gz, then extract
 * GeoLite2-City.mmdb into ./geoip/ via the system `tar`.
 *
 * Privacy: only the .mmdb is fetched/stored. No IP is ever persisted by the app
 * (D-06) — this file is just the lookup database.
 */
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ACCOUNT_ID = process.env.MAXMIND_ACCOUNT_ID || '';
const LICENSE_KEY = process.env.MAXMIND_LICENSE_KEY || '';
const DB_PATH = process.env.GEOLITE_DB_PATH || './geoip/GeoLite2-City.mmdb';
const DOWNLOAD_URL =
  'https://download.maxmind.com/geoip/databases/GeoLite2-City/download?suffix=tar.gz';

function warn(msg) {
  // eslint-disable-next-line no-console
  console.warn(`[fetch-geolite] ${msg}`);
}
function info(msg) {
  // eslint-disable-next-line no-console
  console.log(`[fetch-geolite] ${msg}`);
}
function fail(msg, err) {
  // eslint-disable-next-line no-console
  console.error(`[fetch-geolite] ${msg}`, err || '');
}

function download(url, auth, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'));
    const req = https.get(url, { headers: auth ? { Authorization: `Basic ${auth}` } : {} }, (res) => {
      // MaxMind serves the file via a redirect to a signed (S3) URL that carries its own auth
      // in the query string — re-sending our Basic header to it makes S3 reject with 401.
      // Drop the auth on redirect (mirrors curl's cross-host behaviour).
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        return resolve(download(res.headers.location, null, dest, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve()));
      out.on('error', reject);
    });
    req.on('error', reject);
  });
}

async function main() {
  if (!ACCOUNT_ID || !LICENSE_KEY) {
    warn('MAXMIND_ACCOUNT_ID / MAXMIND_LICENSE_KEY not set — skipping GeoLite2 download (geo disabled, fail-soft).');
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `geolite-${Date.now()}.tar.gz`);
  const tmpExtract = fs.mkdtempSync(path.join(os.tmpdir(), 'geolite-'));
  const destDir = path.dirname(DB_PATH);

  try {
    info('Downloading GeoLite2-City database...');
    const auth = Buffer.from(`${ACCOUNT_ID}:${LICENSE_KEY}`).toString('base64');
    await download(DOWNLOAD_URL, auth, tmpFile);

    info('Extracting GeoLite2-City.mmdb...');
    // MaxMind packs the .mmdb under a dated dir; extract everything then locate it.
    execFileSync('tar', ['-xzf', tmpFile, '-C', tmpExtract], { stdio: 'inherit' });

    let mmdbSrc = null;
    const stack = [tmpExtract];
    while (stack.length) {
      const dir = stack.pop();
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name === 'GeoLite2-City.mmdb') mmdbSrc = full;
      }
    }
    if (!mmdbSrc) throw new Error('GeoLite2-City.mmdb not found in archive');

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(mmdbSrc, DB_PATH);
    info(`GeoLite2-City.mmdb ready at ${DB_PATH}`);
  } catch (err) {
    fail('GeoLite2 download/extract failed — booting with geo disabled (fail-soft).', err);
  } finally {
    try {
      fs.rmSync(tmpFile, { force: true });
      fs.rmSync(tmpExtract, { recursive: true, force: true });
    } catch (_) {
      /* ignore cleanup errors */
    }
  }
}

main()
  .catch((err) => fail('unexpected error (fail-soft)', err))
  .finally(() => process.exit(0)); // ALWAYS exit 0 — never block boot.
