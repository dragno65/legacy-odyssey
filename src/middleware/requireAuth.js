const { supabaseAdmin } = require('../config/supabase');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check if client requested a specific family (multi-book support)
  const requestedFamilyId = req.headers['x-family-id'];

  let family = null;

  if (requestedFamilyId) {
    // Verify the requested family belongs to this auth user
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('id', requestedFamilyId)
      .eq('auth_user_id', user.id)
      .single();
    family = data;
  }

  if (!family) {
    // Fall back to first family for this user
    const { data } = await supabaseAdmin
      .from('families')
      .select('*')
      .eq('auth_user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    family = data;
  }

  if (!family) {
    return res.status(403).json({ error: 'No family account found for this user' });
  }

  req.user = user;
  req.family = family;
  next();
}

module.exports = requireAuth;
