const { Router } = require('express');
const resolveFamily = require('../middleware/resolveFamily');
const { requireBookPassword, hashPassword } = require('../middleware/requireBookPassword');
const bookService = require('../services/bookService');
const { getPublicUrl } = require('../utils/imageUrl');

const router = Router();

// POST /verify-password
router.post('/verify-password', resolveFamily, async (req, res) => {
  if (!req.family) return res.status(404).render('book/not-found');

  const { password } = req.body;
  if (password && password.toLowerCase() === req.family.book_password.toLowerCase()) {
    const cookieName = `book_${req.family.id}`;
    const hash = hashPassword(req.family.book_password, req.family.id);
    res.cookie(cookieName, hash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    });
    return res.redirect('/');
  }

  res.render('book/password', { family: req.family, error: true });
});

// Stripe success callback
router.get('/stripe/success', async (req, res) => {
  const { stripe } = require('../config/stripe');
  const sessionId = req.query.session_id;
  if (!sessionId || !stripe) {
    return res.redirect('/');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const result = await require('../services/stripeService').handleCheckoutComplete(session);
      // Redirect to the new family's subdomain
      const appDomain = process.env.APP_DOMAIN || 'legacyodyssey.com';
      return res.render('marketing/success', {
        subdomain: result.family.subdomain,
        appDomain,
        tempPassword: result.tempPassword,
      });
    }
  } catch (err) {
    console.error('Stripe success handler error:', err);
  }
  res.redirect('/');
});

// GET / — Main book route (or marketing landing page)
router.get('/', resolveFamily, (req, res, next) => {
  // If no family found, show the marketing landing page
  if (req.isMarketingSite) {
    return res.render('marketing/landing');
  }
  next();
}, requireBookPassword, async (req, res, next) => {
  try {
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).render('book/not-found');

    res.render('layouts/book', {
      family: req.family,
      ...data,
      imageUrl: getPublicUrl,
    });
  } catch (err) {
    next(err);
  }
});

// Catch /book/:slug for path-based access
router.get('/book/:slug', resolveFamily, requireBookPassword, async (req, res, next) => {
  try {
    if (!req.family) return res.status(404).render('book/not-found');
    const data = await bookService.getFullBook(req.family.id);
    if (!data) return res.status(404).render('book/not-found');

    res.render('layouts/book', {
      family: req.family,
      ...data,
      imageUrl: getPublicUrl,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
