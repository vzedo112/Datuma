// Source of truth for plan limits. Mirrors the pricing page.
// Plan keys are stored in Clerk publicMetadata.plan on each user;
// Stripe webhooks (future step) will write to publicMetadata.plan
// when subscriptions change, so this stays the single read path.

const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    monthlyIncluded: 3,
    overageEuros: null,
    rowLimit: 50_000,
    seats: 1,
    fileLimit: 2,
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    monthlyIncluded: 20,
    overageEuros: 1.5,
    rowLimit: 1_200_000,
    seats: 1,
    fileLimit: 5,
  },
  team: {
    key: 'team',
    name: 'Team',
    monthlyIncluded: 100,
    overageEuros: 1.0,
    rowLimit: 1_200_000,
    seats: 5,
    fileLimit: 10,
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    monthlyIncluded: Infinity,
    overageEuros: 0,
    rowLimit: 1_200_000,
    seats: Infinity,
    fileLimit: 20,
  },
};

function getPlan(planKey) {
  if (!planKey) return PLANS.starter;
  return PLANS[String(planKey).toLowerCase()] || PLANS.starter;
}

function serializePlan(plan) {
  // Convert Infinity to null for JSON transport.
  return {
    ...plan,
    monthlyIncluded:
      Number.isFinite(plan.monthlyIncluded) ? plan.monthlyIncluded : null,
    seats: Number.isFinite(plan.seats) ? plan.seats : null,
  };
}

module.exports = { PLANS, getPlan, serializePlan };
