const { Router } = require('express');
const requireAdmin = require('../middleware/requireAdmin');
const familyService = require('../services/familyService');
const bookService = require('../services/bookService');
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

    // Enrich with book data (child name)
    const enriched = await Promise.all(
      families.map(async (fam) => {
        const { data: book } = await supabaseAdmin
          .from('books')
          .select('id, child_first_name, child_last_name, hero_image_path')
          .eq('family_id', fam.id)
          .single();

        return {
          ...fam,
          childName: book
            ? `${book.child_first_name || ''} ${book.child_last_name || ''}`.trim()
            : '',
          heroImage: book?.hero_image_path || null,
          hasBook: !!book,
        };
      })
    );

    const stats = {
      total: families.length,
      active: families.filter((f) => f.subscription_status === 'active').length,
      trialing: families.filter((f) => f.subscription_status === 'trialing').length,
      canceled: families.filter((f) => f.subscription_status === 'canceled').length,
    };

    res.render('admin/dashboard', { families: enriched, stats, admin: req.admin });
  } catch (err) {
    next(err);
  }
});

// Family detail (GET)
router.get('/families/:id', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const bookData = await bookService.getFullBook(family.id);

    res.render('admin/family-detail', {
      family,
      bookData,
      admin: req.admin,
      success: req.query.success || null,
      error: req.query.error || null,
    });
  } catch (err) {
    next(err);
  }
});

// Family update (POST)
router.post('/families/:id', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    const allowedFields = [
      'display_name',
      'email',
      'book_password',
      'subdomain',
      'custom_domain',
      'subscription_status',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const val = req.body[field].trim();
        // Only set to null if empty for optional fields
        if (field === 'custom_domain' || field === 'subdomain') {
          updates[field] = val || null;
        } else {
          updates[field] = val;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await familyService.update(family.id, updates);
    }

    res.redirect(`/admin/families/${family.id}?success=Changes+saved+successfully`);
  } catch (err) {
    console.error('Admin update error:', err);
    res.redirect(`/admin/families/${req.params.id}?error=Failed+to+save+changes`);
  }
});

// Toggle active status
router.get('/families/:id/toggle-active', requireAdmin, async (req, res, next) => {
  try {
    const family = await familyService.findById(req.params.id);
    if (!family) return res.status(404).send('Family not found');

    await familyService.update(family.id, { is_active: !family.is_active });

    const action = family.is_active ? 'deactivated' : 'reactivated';
    res.redirect(`/admin/families/${family.id}?success=Account+${action}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
