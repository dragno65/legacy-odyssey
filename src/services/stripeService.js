const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const bookService = require('./bookService');

/**
 * Map of plan + period → Stripe price env var names.
 * Each plan tier has a monthly and annual price ID configured via env vars.
 */
const PRICE_MAP = {
  starter: {
    monthly: 'STRIPE_PRICE_STARTER_MONTHLY',
    annual: 'STRIPE_PRICE_STARTER_ANNUAL',
  },
  family: {
    monthly: 'STRIPE_PRICE_FAMILY_MONTHLY',
    annual: 'STRIPE_PRICE_FAMILY_ANNUAL',
  },
  legacy: {
    monthly: 'STRIPE_PRICE_LEGACY_MONTHLY',
    annual: 'STRIPE_PRICE_LEGACY_ANNUAL',
  },
};

/**
 * Resolve the Stripe price ID for a given plan and billing period.
 * Falls back to STRIPE_PRICE_MONTHLY for backwards compatibility.
 */
function resolvePriceId(plan, period) {
  const tier = PRICE_MAP[plan];
  if (tier) {
    const envVar = tier[period] || tier.monthly;
    const priceId = process.env[envVar];
    if (priceId) return priceId;
  }

  // Fallback: legacy single-price env var
  const fallback = process.env.STRIPE_PRICE_MONTHLY;
  if (fallback) return fallback;

  throw new Error(`No Stripe price configured for plan="${plan}" period="${period}"`);
}

async function createCheckoutSession({ email, subdomain, domain, plan, period, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const resolvedPlan = plan || 'starter';
  const resolvedPeriod = period || 'monthly';
  const priceId = resolvePriceId(resolvedPlan, resolvedPeriod);

  const metadata = { subdomain, plan: resolvedPlan, period: resolvedPeriod };
  if (domain) metadata.domain = domain;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    metadata,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function handleCheckoutComplete(session) {
  const email = session.customer_email || session.customer_details?.email;
  const subdomain = session.metadata?.subdomain;
  const domain = session.metadata?.domain || null;
  const plan = session.metadata?.plan || 'starter';
  const period = session.metadata?.period || 'monthly';
  const stripeCustomerId = session.customer;
  const stripeSubscriptionId = session.subscription;

  // Create auth user in Supabase
  const { supabaseAdmin } = require('../config/supabase');
  const tempPassword = require('crypto').randomBytes(16).toString('hex');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError) throw authError;

  // Create family
  const family = await familyService.create({
    email,
    authUserId: authData.user.id,
    subdomain,
    displayName: `The ${subdomain} Family`,
    stripeCustomerId,
  });

  // Update with subscription ID and plan details
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
    plan,
    billing_period: period,
  });

  // Create book with default content
  await bookService.createBookWithDefaults(family.id);

  // If a custom domain was selected, kick off async domain purchase
  if (domain) {
    try {
      const domainService = require('./domainService');
      const order = await domainService.createDomainOrder({
        familyId: family.id,
        domain,
        stripeSessionId: session.id,
        price: null,
      });

      // Fire-and-forget: purchase and set up domain in background
      domainService.purchaseAndSetupDomain(order.id).catch((err) => {
        console.error(`Background domain setup failed for ${domain}:`, err.message);
      });
    } catch (err) {
      console.error(`Failed to create domain order for ${domain}:`, err.message);
      // Non-fatal: family + book are created, domain can be retried
    }
  }

  return { family, tempPassword, domain };
}

async function syncSubscriptionStatus(stripeCustomerId, status) {
  await familyService.updateSubscriptionStatus(stripeCustomerId, status);
}

async function createPortalSession(stripeCustomerId, returnUrl) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  });

  return session;
}

module.exports = {
  createCheckoutSession,
  handleCheckoutComplete,
  syncSubscriptionStatus,
  createPortalSession,
};
