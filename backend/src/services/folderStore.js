const db = require('../db');

const MAX_NAME_LEN = 60;

function cleanName(name) {
  return String(name || '').trim().slice(0, MAX_NAME_LEN);
}

async function listFolders(userId) {
  if (!db.isReady() || !userId) return [];
  const r = await db.query(
    `SELECT f.id, f.name, f.created_at,
            COUNT(d.id)::int AS dashboard_count
     FROM folders f
     LEFT JOIN dashboards d
       ON d.folder_id = f.id
      AND d.user_id = f.user_id
      AND d.deleted_at IS NULL
     WHERE f.user_id = $1
     GROUP BY f.id
     ORDER BY f.name ASC`,
    [userId]
  );
  return r.rows;
}

async function countUnfiled(userId) {
  if (!db.isReady() || !userId) return 0;
  const r = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM dashboards
     WHERE user_id = $1 AND folder_id IS NULL AND deleted_at IS NULL`,
    [userId]
  );
  return r.rows[0]?.n ?? 0;
}

async function createFolder(userId, name) {
  if (!db.isReady() || !userId) return null;
  const clean = cleanName(name);
  if (!clean) return null;
  const r = await db.query(
    `INSERT INTO folders (user_id, name)
     VALUES ($1, $2)
     RETURNING id, name, created_at`,
    [userId, clean]
  );
  return { ...r.rows[0], dashboard_count: 0 };
}

async function renameFolder(userId, folderId, name) {
  if (!db.isReady() || !userId) return false;
  const clean = cleanName(name);
  if (!clean) return false;
  const r = await db.query(
    `UPDATE folders SET name = $1 WHERE id = $2 AND user_id = $3`,
    [clean, folderId, userId]
  );
  return r.rowCount > 0;
}

async function deleteFolder(userId, folderId) {
  if (!db.isReady() || !userId) return false;
  const r = await db.query(
    `DELETE FROM folders WHERE id = $1 AND user_id = $2`,
    [folderId, userId]
  );
  return r.rowCount > 0;
}

// Set or clear a dashboard's folder. Pass folderId = null to move to top-level.
async function moveDashboardToFolder(userId, dashboardId, folderId) {
  if (!db.isReady() || !userId) return false;
  // Verify ownership of both rows before writing.
  if (folderId !== null) {
    const owns = await db.query(
      `SELECT 1 FROM folders WHERE id = $1 AND user_id = $2`,
      [folderId, userId]
    );
    if (owns.rowCount === 0) return false;
  }
  const r = await db.query(
    `UPDATE dashboards SET folder_id = $1
     WHERE id = $2 AND user_id = $3`,
    [folderId, dashboardId, userId]
  );
  return r.rowCount > 0;
}

module.exports = {
  listFolders,
  countUnfiled,
  createFolder,
  renameFolder,
  deleteFolder,
  moveDashboardToFolder,
};
