const crypto = require('crypto');
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
    `SELECT id, name, filename, row_count, created_at,
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

async function renameDashboard(id, userId, name) {
  if (!db.isReady() || !userId) return false;
  const trimmed = (name ?? '').toString().trim().slice(0, 120);
  const result = await db.query(
    `UPDATE dashboards
     SET name = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id`,
    [trimmed || null, id, userId]
  );
  return result.rowCount > 0;
}

async function deleteDashboard(id, userId) {
  if (!db.isReady() || !userId) return false;
  const result = await db.query(
    `DELETE FROM dashboards
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
}

async function getDashboard(id, userId) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `SELECT id, name, filename, row_count, dashboard, created_at, share_token
     FROM dashboards
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return result.rows[0] ?? null;
}

async function createShareToken(id, userId) {
  if (!db.isReady() || !userId) return null;
  const existing = await db.query(
    `SELECT share_token FROM dashboards WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (existing.rows.length === 0) return null;
  if (existing.rows[0].share_token) return existing.rows[0].share_token;

  const token = crypto.randomBytes(24).toString('base64url');
  const result = await db.query(
    `UPDATE dashboards
     SET share_token = $1
     WHERE id = $2 AND user_id = $3
     RETURNING share_token`,
    [token, id, userId]
  );
  return result.rows[0]?.share_token ?? null;
}

async function revokeShareToken(id, userId) {
  if (!db.isReady() || !userId) return false;
  const result = await db.query(
    `UPDATE dashboards
     SET share_token = NULL
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
}

async function getDashboardByToken(token) {
  if (!db.isReady() || !token) return null;
  const result = await db.query(
    `SELECT id, filename, row_count, dashboard, created_at
     FROM dashboards
     WHERE share_token = $1`,
    [token]
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
  createShareToken,
  revokeShareToken,
  getDashboardByToken,
  renameDashboard,
  deleteDashboard,
};
