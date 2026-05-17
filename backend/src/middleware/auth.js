const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');

const isClerkConfigured = Boolean(process.env.CLERK_SECRET_KEY);

if (!isClerkConfigured) {
  console.warn(
    '[auth] Clerk env vars not set — running in dev mode (anonymous access allowed).'
  );
}

function withClerk() {
  if (!isClerkConfigured) {
    return (req, _res, next) => {
      next();
    };
  }
  return clerkMiddleware();
}

function requireUser() {
  if (!isClerkConfigured) {
    return (req, _res, next) => {
      req.auth = { userId: 'dev-user', sessionId: null };
      next();
    };
  }
  return requireAuth();
}

function getUserId(req) {
  if (!isClerkConfigured) return req.auth?.userId ?? null;
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

module.exports = { withClerk, requireUser, getUserId, isClerkConfigured };
