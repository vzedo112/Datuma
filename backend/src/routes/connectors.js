const express = require('express');
const { getUserId } = require('../middleware/auth');
const db = require('../db');

// Anything not in this set is rejected so we don't accumulate junk rows.
// Add new sources here when we expand the teaser grid.
const VALID_SOURCES = new Set([
  'google-drive',
  'onedrive',
  'dropbox',
  'snowflake',
  'databricks',
  'bigquery',
  'redshift',
  'postgres',
  'airtable',
  'notion',
  'hubspot',
  'salesforce',
  'stripe',
  'shopify',
]);

const router = express.Router();

// POST /api/connectors/interest
// Body: { source: 'google-drive' }
// Records demand. Best-effort: if the DB is unavailable we still 200 so the
// frontend UX isn't degraded — this is a telemetry-shaped endpoint, not a
// transactional one.
router.post('/interest', async (req, res) => {
  try {
    const { source } = req.body || {};
    if (!source || !VALID_SOURCES.has(source)) {
      return res.status(400).json({ error: 'Unknown source' });
    }
    const userId = getUserId(req); // may be null for unauthenticated callers
    if (db.isReady()) {
      try {
        await db.query(
          `INSERT INTO connector_interest (user_id, source) VALUES ($1, $2)`,
          [userId, source]
        );
      } catch (err) {
        console.warn('[connectors] failed to record interest:', err.message);
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Connector interest error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/connectors/stats
// Returns demand counts per source. Useful for sorting the build queue.
// Not protected because the data is non-sensitive aggregates; lock down later
// if you ever want this gated behind an admin role.
router.get('/stats', async (req, res) => {
  try {
    if (!db.isReady()) return res.json({ items: [] });
    const r = await db.query(
      `SELECT source,
              COUNT(*)::int AS total,
              COUNT(DISTINCT user_id)::int AS unique_users,
              MAX(created_at) AS last_at
       FROM connector_interest
       GROUP BY source
       ORDER BY unique_users DESC, total DESC`
    );
    res.json({ items: r.rows });
  } catch (err) {
    console.error('Connector stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
