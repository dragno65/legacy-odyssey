const { stripe } = require('../config/stripe');
const familyService = require('./familyService');
const bookService = require('./bookService');

async function createCheckoutSession({ email, subdomain, successUrl, cancelUrl }) {
  if (!stripe) throw new Error('Stripe not configured');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price: process.env.STRIPE_PRICE_MONTHLY,
      quantity: 1,
    }],
    metadata: { subdomain },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

async function handleCheckoutComplete(session) {
  const email = session.customer_email || session.customer_details?.email;
  const subdomain = session.metadata?.subdomain;
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

  // Update with subscription ID
  await familyService.update(family.id, {
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: 'active',
  });

  // Create book with default content
  await bookService.createBookWithDefaults(family.id);

  return { family, tempPassword };
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
