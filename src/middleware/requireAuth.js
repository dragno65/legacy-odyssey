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

  // Look up the family associated with this auth user
  const { data: family } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!family) {
    return res.status(403).json({ error: 'No family account found for this user' });
  }

  req.user = user;
  req.family = family;
  next();
}

module.exports = requireAuth;
