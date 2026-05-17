const { clerkMiddleware, requireAuth, getAuth } = require('@clerk/express');

const publishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!process.env.CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  process.env.CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
}

const isClerkConfigured = Boolean(process.env.CLERK_SECRET_KEY && publishableKey);

if (!isClerkConfigured) {
  const hasSecret = Boolean(process.env.CLERK_SECRET_KEY);
  const hasPublishable = Boolean(publishableKey);
  console.warn(
    `[auth] Clerk not fully configured (secret: ${hasSecret ? "yes" : "no"}, publishable: ${hasPublishable ? "yes" : "no"}) — running in dev mode (anonymous access allowed).`
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
