const express = require('express');
const { clerkClient } = require('@clerk/express');
const {
  requireUser,
  getUserId,
  setUserSpendCap,
  invalidatePlanCache,
} = require('../middleware/auth');
const {
  stripe,
  isStripeConfigured,
  getPriceId,
  planForPrice,
} = require('../services/stripe');

const router = express.Router();

function notConfigured(res) {
  return res
    .status(503)
    .json({ error: 'Billing not configured. Set STRIPE_SECRET_KEY and price IDs.' });
}

async function getOrCreateCustomer(userId) {
  const user = await clerkClient.users.getUser(userId);
  const existing = user.publicMetadata?.stripeCustomerId;
  if (existing) return { user, customerId: existing };

  const email = user.primaryEmailAddress?.emailAddress;
  const customer = await stripe.customers.create({
    email,
    name: user.fullName || undefined,
    metadata: { clerkUserId: userId },
  });
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: { ...user.publicMetadata, stripeCustomerId: customer.id },
  });
  return { user, customerId: customer.id };
}

// POST /api/billing/checkout — kicks off a Stripe-hosted Checkout session.
// Body: { plan: "pro"|"team", interval: "monthly"|"annual" }
router.post('/checkout', requireUser(), async (req, res) => {
  if (!isStripeConfigured) return notConfigured(res);

  try {
    const { plan, interval = 'monthly' } = req.body || {};
    const priceId = getPriceId(plan, interval);
    if (!priceId) {
      return res.status(400).json({
        error: 'Invalid plan/interval, or matching Stripe price ID not configured.',
      });
    }

    const userId = getUserId(req);
    const { customerId } = await getOrCreateCustomer(userId);

    const origin = req.headers.origin || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      // client_reference_id is the belt-and-braces identifier we use in the
      // webhook to resolve the Clerk user, even if the customer's metadata
      // gets mangled. subscription_data.metadata is on the subscription
      // itself, useful for the subscription.* events.
      client_reference_id: userId,
      subscription_data: { metadata: { clerkUserId: userId } },
      success_url: `${origin}/app?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/portal — opens the Stripe Customer Portal so the user
// can cancel / upgrade / update card / download invoices.
router.post('/portal', requireUser(), async (req, res) => {
  if (!isStripeConfigured) return notConfigured(res);

  try {
    const userId = getUserId(req);
    const user = await clerkClient.users.getUser(userId);
    const customerId = user.publicMetadata?.stripeCustomerId;
    if (!customerId) {
      return res
        .status(400)
        .json({ error: 'No active subscription. Subscribe first.' });
    }

    const origin = req.headers.origin || 'http://localhost:3000';
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/app/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/billing/resync — force-pull the user's Stripe subscription state
// and write it into Clerk. Useful when a webhook was missed, raced, or quietly
// no-op'd. Always safe to call.
router.post('/resync', requireUser(), async (req, res) => {
  if (!isStripeConfigured) return notConfigured(res);

  try {
    const userId = getUserId(req);
    const user = await clerkClient.users.getUser(userId);
    const customerId = user.publicMetadata?.stripeCustomerId;
    if (!customerId) {
      return res.json({
        ok: true,
        plan: user.publicMetadata?.plan ?? 'starter',
        message: 'No Stripe customer yet — nothing to sync.',
      });
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 5,
    });

    // Prefer an active/trialing/past_due subscription if one exists; otherwise
    // pick the most recent. This handles the rare "two subs at once" case.
    const sorted = [...subs.data].sort((a, b) => b.created - a.created);
    const active = sorted.find((s) =>
      ['active', 'trialing', 'past_due'].includes(s.status)
    );
    const sub = active || sorted[0];

    if (!sub) {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: { ...user.publicMetadata, plan: 'starter' },
      });
      invalidatePlanCache(userId);
      return res.json({ ok: true, plan: 'starter', message: 'No subscriptions found.' });
    }

    const status = sub.status;
    const priceId = sub.items?.data?.[0]?.price?.id;
    const isInactive =
      status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid';
    const planKey = isInactive ? 'starter' : planForPrice(priceId);

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        plan: planKey,
        stripeSubscriptionId: sub.id,
        stripeStatus: status,
      },
    });
    invalidatePlanCache(userId);

    console.log(
      `[billing/resync] ${userId} → plan=${planKey} status=${status} priceId=${priceId} sub=${sub.id}`
    );

    res.json({
      ok: true,
      plan: planKey,
      status,
      priceMatched: planKey !== 'starter' || isInactive,
      priceId,
    });
  } catch (err) {
    console.error('Resync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/billing/spend-cap — sets the user's monthly overage ceiling in
// cents. 0 means "no overage allowed" (hard-block at included).
router.patch('/spend-cap', requireUser(), async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amountCents } = req.body || {};
    const n = Number(amountCents);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({ error: 'amountCents must be a non-negative number' });
    }
    if (n > 100_000_00) {
      return res.status(400).json({ error: 'Spend cap may not exceed €100,000.' });
    }
    const ok = await setUserSpendCap(userId, Math.floor(n));
    if (!ok) return res.status(503).json({ error: 'Auth provider unavailable' });
    res.json({ spendCapCents: Math.floor(n) });
  } catch (err) {
    console.error('Spend cap update error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
