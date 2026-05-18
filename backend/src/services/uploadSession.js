const crypto = require('crypto');

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const sessions = new Map();

function sweep() {
  const now = Date.now();
  for (const [id, sess] of sessions.entries()) {
    if (sess.expiresAt <= now) sessions.delete(id);
  }
}

setInterval(sweep, 60 * 1000).unref();

function create(userId, datasets) {
  const id = crypto.randomBytes(18).toString('base64url');
  sessions.set(id, {
    userId,
    datasets,
    expiresAt: Date.now() + TTL_MS,
  });
  return id;
}

function get(id, userId) {
  const sess = sessions.get(id);
  if (!sess) return null;
  if (sess.expiresAt <= Date.now()) {
    sessions.delete(id);
    return null;
  }
  if (sess.userId !== userId) return null;
  return sess;
}

function evict(id) {
  sessions.delete(id);
}

module.exports = { create, get, evict };
