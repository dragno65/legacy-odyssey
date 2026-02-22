const { Router } = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const familyService = require('../services/familyService');
const { supabaseAdmin } = require('../config/supabase');

const router = Router();

// Admin login
router.get('/login', (req, res) => {
  res.render('admin/login', { error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { supabaseAnon } = require('../config/supabase');
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

  if (error) {
    return res.render('admin/login', { error: 'Invalid credentials' });
  }

  // Verify user is an admin
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', data.user.id)
    .single();

  if (!admin) {
    return res.render('admin/login', { error: 'Not an admin account' });
  }

  res.cookie('admin_token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  });

  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const families = await familyService.listAll();

    const stats = {
      total: families.length,
      active: families.filter((f) => f.subscription_status === 'active').length,
      trialing: families.filter((f) => f.subscription_status === 'trialing').length,
      canceled: families.filter((f) => f.subscription_status === 'canceled').length,
    };

    res.render('admin/dashboard', { families, stats, admin: req.admin });
  } catch (err) {
    next(err);
  }
});

// Family detail
router.get('/families/:id', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const bookService = require('../services/bookService');
    const bookData = await bookService.getFullBook(family.id);

    res.render('admin/family-detail', { family, bookData, admin: req.admin });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
