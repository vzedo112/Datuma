const db = require('../db');

async function saveDashboard({ userId, filename, rowCount, dashboard }) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `INSERT INTO dashboards (user_id, filename, row_count, dashboard)
     VALUES ($1, $2, $3, $4)
     RETURNING id, created_at`,
    [userId, filename, rowCount, dashboard]
  );
  return result.rows[0];
}

async function listDashboards(userId, { limit = 50 } = {}) {
  if (!db.isReady() || !userId) return [];
  const result = await db.query(
    `SELECT id, filename, row_count, created_at,
            dashboard->>'title' AS title,
            dashboard->>'domain' AS domain
     FROM dashboards
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function getDashboard(id, userId) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `SELECT id, filename, row_count, dashboard, created_at
     FROM dashboards
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

async function countThisMonth(userId) {
  if (!db.isReady() || !userId) return 0;
  const result = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM dashboards
     WHERE user_id = $1
       AND created_at >= DATE_TRUNC('month', NOW())`,
    [userId]
  );
  return result.rows[0]?.n ?? 0;
}

module.exports = {
  saveDashboard,
  listDashboards,
  getDashboard,
  countThisMonth,
};
