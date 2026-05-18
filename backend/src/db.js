const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const IS_PROD = process.env.NODE_ENV === 'production';

const BOOT_RETRY_BUDGET_MS = 30_000;
const BOOT_RETRY_INTERVAL_MS = 1_500;
const HEALTH_PROBE_INTERVAL_MS = 30_000;

let pool = null;
let ready = false;
let probeTimer = null;

if (connectionString) {
  pool = new Pool({ connectionString });
  pool.on('error', (err) => {
    console.error('[db] unexpected pool error:', err.message);
    ready = false;
  });
}

function startHealthProbe() {
  if (probeTimer) clearInterval(probeTimer);
  probeTimer = setInterval(async () => {
    if (!pool) return;
    try {
      await pool.query('SELECT 1');
      if (!ready) {
        console.log('[db] connection recovered.');
        ready = true;
      }
    } catch (err) {
      if (ready) {
        console.warn(`[db] connection lost (${err.message}) — will keep probing.`);
        ready = false;
      }
    }
  }, HEALTH_PROBE_INTERVAL_MS);
  // Don't keep the process alive just for the probe.
  if (probeTimer.unref) probeTimer.unref();
}

async function tryInitOnce() {
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
}

async function init() {
  if (!pool) {
    const msg = '[db] DATABASE_URL not set — persistence disabled.';
    if (IS_PROD) {
      console.error(`${msg} REFUSING TO START IN PRODUCTION.`);
      process.exit(1);
    }
    console.warn(msg);
    return false;
  }

  const deadline = Date.now() + BOOT_RETRY_BUDGET_MS;
  let lastError = null;

  while (true) {
    try {
      await tryInitOnce();
      ready = true;
      console.log('[db] connected + schema ready.');
      startHealthProbe();
      return true;
    } catch (err) {
      lastError = err;
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      const wait = Math.min(BOOT_RETRY_INTERVAL_MS, remaining);
      console.warn(
        `[db] not ready (${err.code || err.message}) — retrying in ${(wait / 1000).toFixed(1)}s` +
          ` (${(remaining / 1000).toFixed(0)}s budget left)`
      );
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  ready = false;
  const msg = `[db] could not connect after ${BOOT_RETRY_BUDGET_MS / 1000}s: ${lastError?.message}`;
  if (IS_PROD) {
    console.error(`${msg} — REFUSING TO START.`);
    process.exit(1);
  }
  console.warn(`${msg} — running in degraded mode (persistence disabled).`);
  // Keep probing in case the DB comes up later — useful in dev when you start
  // Postgres a minute after the backend.
  startHealthProbe();
  return false;
}

function isReady() {
  return ready;
}

async function query(text, params) {
  if (!ready) throw new Error('Database not ready');
  try {
    return await pool.query(text, params);
  } catch (err) {
    // A query failure may indicate the connection went bad. Mark unhealthy so
    // the next health probe re-checks; subsequent calls will see !ready until
    // the probe confirms recovery.
    if (err.code === 'ECONNREFUSED' || err.code === '57P01' || err.code === '57P02' || err.code === '57P03') {
      ready = false;
    }
    throw err;
  }
}

module.exports = { init, isReady, query };
