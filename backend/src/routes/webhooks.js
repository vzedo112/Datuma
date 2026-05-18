const express = require('express');
const { clerkClient } = require('@clerk/express');
const { stripe, isStripeConfigured, planForPrice } = require('../services/stripe');
const { invalidatePlanCache } = require('../middleware/auth');

const router = express.Router();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function syncSubscription(sub) {
  if (!sub) return;
  const customer = await stripe.customers.retrieve(sub.customer);
  const clerkUserId = customer?.metadata?.clerkUserId;
  if (!clerkUserId) {
    console.warn('[webhook] subscription has no clerkUserId metadata, skipping');
    return;
  }

  const status = sub.status; // active | trialing | past_due | canceled | unpaid | incomplete | ...
  const priceId = sub.items?.data?.[0]?.price?.id;
  const planKey =
    status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid'
      ? 'starter'
      : planForPrice(priceId);

  const user = await clerkClient.users.getUser(clerkUserId);
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      ...user.publicMetadata,
      plan: planKey,
      stripeSubscriptionId: sub.id,
      stripeStatus: status,
    },
  });
  invalidatePlanCache(clerkUserId);
  console.log(`[webhook] synced ${clerkUserId} → plan=${planKey} status=${status}`);
}

// Body parser is `express.raw` (set in index.js), so req.body is a Buffer.
router.post('/stripe', async (req, res) => {
  if (!isStripeConfigured || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object);
        break;
      }
      case 'checkout.session.completed': {
        // After a successful checkout, the subscription webhook usually fires
        // right after with full state — nothing to do here.
        break;
      }
      default:
        // Ignored event types.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[webhook] handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
