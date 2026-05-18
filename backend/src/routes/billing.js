const express = require('express');
const { clerkClient } = require('@clerk/express');
const { requireUser, getUserId } = require('../middleware/auth');
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

module.exports = router;
