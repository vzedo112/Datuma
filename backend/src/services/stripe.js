const Stripe = require('stripe');

const secretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(secretKey, {
  apiVersion: '2023-10-16', // Use the stripe API version you prefer
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

module.exports = {
  stripe,
  isStripeConfigured,
  getPriceId,
};