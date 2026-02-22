const { Router } = require('express');
const { supabaseAdmin } = require('../../config/supabase');
const familyService = require('../../services/familyService');

const router = Router();

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, subdomain, displayName } = req.body;

    if (!email || !password || !subdomain) {
      return res.status(400).json({ error: 'email, password, and subdomain are required' });
    }

    // Check subdomain availability
    const existing = await familyService.findBySubdomain(subdomain);
    if (existing) {
      return res.status(409).json({ error: 'This subdomain is already taken' });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create family record
    const family = await familyService.create({
      email,
      authUserId: authData.user.id,
      subdomain,
      displayName: displayName || `The ${subdomain} Family`,
    });

    // Create book with defaults
    const bookService = require('../../services/bookService');
    const book = await bookService.createBookWithDefaults(family.id);

    // Sign in to get tokens
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    // Use signInWithPassword to get session
    const { supabaseAnon } = require('../../config/supabase');
    const { data: session, error: sessionError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return res.status(500).json({ error: 'Account created but login failed. Please try logging in.' });
    }

    res.status(201).json({
      family,
      book,
      session: {
        access_token: session.session.access_token,
        refresh_token: session.session.refresh_token,
        expires_at: session.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { supabaseAnon } = require('../../config/supabase');
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get the family for this user
    const family = await familyService.findByAuthUserId(data.user.id);
    if (!family) {
      return res.status(403).json({ error: 'No family account found' });
    }

    res.json({
      family,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'refresh_token is required' });
    }

    const { supabaseAnon } = require('../../config/supabase');
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });

    if (error) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
