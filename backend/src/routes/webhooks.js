const express = require('express');
const { clerkClient } = require('@clerk/express');
const { stripe, isStripeConfigured, planForPrice } = require('../services/stripe');
const { invalidatePlanCache } = require('../middleware/auth');

const router = express.Router();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Resolve a Clerk user id from a subscription or checkout session. Prefer
// explicit metadata; fall back to the Stripe customer's metadata as a
// secondary path. Returns null if we can't find one (we log loudly).
async function resolveClerkUserId({ sub = null, session = null }) {
  // 1) Subscription.metadata.clerkUserId (set via subscription_data.metadata at checkout).
  const subMetaId = sub?.metadata?.clerkUserId;
  if (subMetaId) return subMetaId;

  // 2) Session.client_reference_id (set on checkout creation).
  const sessionRef = session?.client_reference_id;
  if (sessionRef) return sessionRef;

  // 3) Stripe customer's metadata.clerkUserId (set by getOrCreateCustomer).
  const customerId = sub?.customer || session?.customer;
  if (!customerId) return null;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer?.metadata?.clerkUserId ?? null;
  } catch (err) {
    console.warn('[webhook] failed to retrieve customer:', err.message);
    return null;
  }
}

async function syncSubscription(sub, { sessionForFallback = null } = {}) {
  if (!sub) {
    console.warn('[webhook] syncSubscription called with no subscription');
    return;
  }

  const clerkUserId = await resolveClerkUserId({ sub, session: sessionForFallback });
  if (!clerkUserId) {
    console.warn(
      `[webhook] could not resolve clerkUserId for subscription ${sub.id} (customer=${sub.customer}). Skipping.`
    );
    return;
  }

  const status = sub.status; // active | trialing | past_due | canceled | unpaid | incomplete | ...
  const priceId = sub.items?.data?.[0]?.price?.id;
  // TODO(billing): past_due intentionally keeps the user on their paid plan so
  // a transient card failure doesn't immediately lock them out. Cost is that a
  // user with a permanently-broken card can still generate overage during the
  // ~3 week Stripe retry window. Revisit if overage abuse becomes real (e.g.
  // by blocking overage gen while past_due, but still allowing base quota).
  const isInactive =
    status === 'canceled' || status === 'incomplete_expired' || status === 'unpaid';
  const planKey = isInactive ? 'starter' : planForPrice(priceId);

  if (!isInactive && planKey === 'starter') {
    console.warn(
      `[webhook] price ${priceId} did not match any configured plan, defaulting to starter. Check STRIPE_PRICE_* env vars.`
    );
  }

  try {
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
    console.log(
      `[webhook] synced ${clerkUserId} → plan=${planKey} status=${status} sub=${sub.id}`
    );
  } catch (err) {
    console.error(`[webhook] failed to update Clerk metadata for ${clerkUserId}:`, err.message);
    throw err; // let Stripe retry
  }
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

  console.log(`[webhook] received ${event.type} (id=${event.id})`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // Primary sync path: when checkout completes, fetch the full
        // subscription and run the sync immediately. Subscription events
        // fire too, but this catches anything where they race or miss.
        const session = event.data.object;
        if (session.mode !== 'subscription' || !session.subscription) {
          console.log('[webhook] checkout.session.completed without subscription, skipping');
          break;
        }
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(sub, { sessionForFallback: session });
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object);
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
