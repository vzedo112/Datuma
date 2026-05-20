const db = require('../db');

async function listMessages(dashboardId, userId, { limit = 200 } = {}) {
  if (!db.isReady() || !userId) return [];
  const r = await db.query(
    `SELECT id, role, content, created_at
     FROM chat_messages
     WHERE dashboard_id = $1 AND user_id = $2
     ORDER BY created_at ASC
     LIMIT $3`,
    [dashboardId, userId, limit]
  );
  return r.rows;
}

async function appendMessage({ dashboardId, userId, role, content }) {
  if (!db.isReady() || !userId) return null;
  const r = await db.query(
    `INSERT INTO chat_messages (dashboard_id, user_id, role, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, role, content, created_at`,
    [dashboardId, userId, role, content]
  );
  return r.rows[0];
}

async function clearThread(dashboardId, userId) {
  if (!db.isReady() || !userId) return false;
  const r = await db.query(
    `DELETE FROM chat_messages WHERE dashboard_id = $1 AND user_id = $2`,
    [dashboardId, userId]
  );
  return r.rowCount > 0;
}

// Count this month's user-sent messages across all dashboards. We count
// only role='user' because that's what the user pays for — replies are free.
async function countUserMessagesThisMonth(userId) {
  if (!db.isReady() || !userId) return 0;
  const r = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM chat_messages
     WHERE user_id = $1
       AND role = 'user'
       AND created_at >= DATE_TRUNC('month', NOW())`,
    [userId]
  );
  return r.rows[0]?.n ?? 0;
}

module.exports = {
  listMessages,
  appendMessage,
  clearThread,
  countUserMessagesThisMonth,
};
