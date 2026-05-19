const express = require('express');
const { clerkClient } = require('@clerk/express');
const { requireUser, getUserId, setUserSpendCap } = require('../middleware/auth');
const { stripe, isStripeConfigured, getPriceId } = require('../services/stripe');

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
