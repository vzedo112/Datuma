const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

let pool = null;
let ready = false;

if (connectionString) {
  pool = new Pool({ connectionString });
  pool.on('error', (err) => {
    console.error('[db] unexpected pool error:', err.message);
  });
}

async function init() {
  if (!pool) {
    console.warn('[db] DATABASE_URL not set — persistence disabled.');
    return false;
  }
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    ready = true;
    console.log('[db] connected + schema ready.');
    return true;
  } catch (err) {
    ready = false;
    console.warn(
      `[db] connection or schema init failed (${err.message}) — persistence disabled.`
    );
    return false;
  }
}

function isReady() {
  return ready;
}

async function query(text, params) {
  if (!ready) throw new Error('Database not ready');
  return pool.query(text, params);
}

module.exports = { init, isReady, query };
