const Stripe = require('stripe');

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16',
});

const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY &&
  process.env.STRIPE_PRICE_PRO_MONTHLY &&
  process.env.STRIPE_PRICE_PRO_ANNUAL &&
  process.env.STRIPE_PRICE_TEAM_MONTHLY &&
  process.env.STRIPE_PRICE_TEAM_ANNUAL
);

if (!isStripeConfigured) {
  console.warn('[stripe] Stripe environment variables are missing. Billing is disabled.');
}

function getPriceId(plan, interval) {
  if (plan === 'pro') {
    return interval === 'annual'
      ? process.env.STRIPE_PRICE_PRO_ANNUAL
      : process.env.STRIPE_PRICE_PRO_MONTHLY;
  }
  if (plan === 'team') {
    return interval === 'annual'
      ? process.env.STRIPE_PRICE_TEAM_ANNUAL
      : process.env.STRIPE_PRICE_TEAM_MONTHLY;
  }
  return null;
}

// Reverse map: Stripe price ID → plan key. Used by the subscription webhook
// to figure out which plan the user just landed on.
function planForPrice(priceId) {
  if (!priceId) return 'starter';
  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'pro';
  }
  if (
    priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_TEAM_ANNUAL
  ) {
    return 'team';
  }
  return 'starter';
}

// Adds a one-off line item to the customer's *next* invoice. We don't pin
// it to a specific subscription — Stripe attaches it to whichever invoice
// closes next, which is the right behaviour for monthly overage charges.
async function createOverageInvoiceItem({ customerId, amountCents, description }) {
  if (!isStripeConfigured) return null;
  if (!customerId || !Number.isFinite(amountCents) || amountCents <= 0) return null;
  return stripe.invoiceItems.create({
    customer: customerId,
    amount: Math.round(amountCents),
    currency: 'eur',
    description,
  });
}

module.exports = {
  stripe,
  isStripeConfigured,
  getPriceId,
  planForPrice,
  createOverageInvoiceItem,
};
