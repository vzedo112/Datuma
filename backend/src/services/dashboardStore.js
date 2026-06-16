const crypto = require('crypto');
const db = require('../db');

async function saveDashboard({ userId, filename, rowCount, dashboard, parentId = null }) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `INSERT INTO dashboards (user_id, filename, row_count, dashboard, parent_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [userId, filename, rowCount, dashboard, parentId]
  );
  return result.rows[0];
}

// folderId semantics:
//   undefined → no filter (all dashboards)
//   null      → only top-level (unfiled) dashboards
//   number    → only dashboards in that folder
async function listDashboards(userId, { limit = 50, folderId } = {}) {
  if (!db.isReady() || !userId) return [];

  const params = [userId];
  let where = `d.user_id = $1 AND d.deleted_at IS NULL`;
  if (folderId === null) {
    where += ` AND d.folder_id IS NULL`;
  } else if (folderId !== undefined) {
    params.push(folderId);
    where += ` AND d.folder_id = $${params.length}`;
  }
  params.push(limit);

  const result = await db.query(
    `SELECT d.id, d.name, d.filename, d.row_count, d.created_at, d.parent_id, d.folder_id,
            d.dashboard->>'title' AS title,
            d.dashboard->>'domain' AS domain,
            p.name AS parent_name,
            p.filename AS parent_filename,
            p.dashboard->>'title' AS parent_title
     FROM dashboards d
     LEFT JOIN dashboards p ON p.id = d.parent_id AND p.user_id = d.user_id
     WHERE ${where}
     ORDER BY d.created_at DESC
     LIMIT $${params.length}`,
    params
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
  // Soft-delete so the row still counts toward the user's monthly quota.
  // Reads filter on deleted_at IS NULL everywhere.
  const result = await db.query(
    `UPDATE dashboards
     SET deleted_at = NOW(), share_token = NULL
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
     RETURNING id`,
    [id, userId]
  );
  return result.rowCount > 0;
}

async function updateDashboardSpec(id, userId, newDashboard) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `UPDATE dashboards
        SET dashboard = $1
      WHERE id = $2 AND user_id = $3
      RETURNING id, name, filename, row_count, dashboard, created_at, share_token`,
    [newDashboard, id, userId]
  );
  return result.rows[0] ?? null;
}

async function getDashboard(id, userId) {
  if (!db.isReady() || !userId) return null;
  const result = await db.query(
    `SELECT id, name, filename, row_count, dashboard, created_at, share_token, parent_id
     FROM dashboards
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
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

async function listRecentWithContext(userId, { limit = 5 } = {}) {
  if (!db.isReady() || !userId) return [];
  const result = await db.query(
    `SELECT id, name, filename, created_at,
            dashboard->>'title' AS title,
            dashboard AS dashboard
     FROM dashboards
     WHERE user_id = $1
       AND deleted_at IS NULL
       AND dashboard ? 'analysisContext'
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function getDashboardByToken(token) {
  if (!db.isReady() || !token) return null;
  const result = await db.query(
    `SELECT id, filename, row_count, dashboard, created_at
     FROM dashboards
     WHERE share_token = $1 AND deleted_at IS NULL`,
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
  listRecentWithContext,
  updateDashboardSpec,
};
