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

// In-memory cache for plan lookups so we don't hit Clerk on every request.
// 60 second TTL — short enough that Stripe webhook updates show up quickly.
const planCache = new Map();
const PLAN_TTL_MS = 60_000;

async function getUserPlan(req) {
  if (!isClerkConfigured) return 'starter';
  const userId = getUserId(req);
  if (!userId) return 'starter';

  const cached = planCache.get(userId);
  if (cached && cached.expires > Date.now()) return cached.plan;

  try {
    const user = await clerkClient.users.getUser(userId);
    const plan = (user?.publicMetadata?.plan || 'starter').toLowerCase();
    planCache.set(userId, { plan, expires: Date.now() + PLAN_TTL_MS });
    return plan;
  } catch (err) {
    console.warn('[auth] failed to fetch user plan:', err.message);
    return 'starter';
  }
}

function invalidatePlanCache(userId) {
  if (userId) planCache.delete(userId);
  else planCache.clear();
}

module.exports = {
  withClerk,
  requireUser,
  getUserId,
  getUserPlan,
  invalidatePlanCache,
  isClerkConfigured,
};
