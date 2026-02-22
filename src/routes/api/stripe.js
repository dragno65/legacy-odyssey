const { Router } = require('express');
const stripeService = require('../../services/stripeService');
const requireAuth = require('../../middleware/requireAuth');

const router = Router();

// POST /api/stripe/create-checkout
router.post('/create-checkout', async (req, res, next) => {
  try {
    const { email, subdomain } = req.body;
    if (!email || !subdomain) {
      return res.status(400).json({ error: 'email and subdomain are required' });
    }

    const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
    const session = await stripeService.createCheckoutSession({
      email,
      subdomain,
      successUrl: `https://${appDomain}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `https://${appDomain}/pricing`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/stripe/portal — Billing management
router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    if (!req.family.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const returnUrl = req.body.return_url || `https://${process.env.APP_DOMAIN || 'legacyodyssey.com'}`;
    const session = await stripeService.createPortalSession(
      req.family.stripe_customer_id,
      returnUrl
    );

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
