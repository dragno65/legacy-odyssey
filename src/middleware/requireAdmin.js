const { supabaseAdmin } = require('../config/supabase');

async function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.redirect('/admin/login');
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }

  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (!admin) {
    res.clearCookie('admin_token');
    return res.redirect('/admin/login');
  }

  req.admin = admin;
  req.user = user;
  next();
}

module.exports = requireAdmin;
