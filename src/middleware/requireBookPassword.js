const crypto = require('crypto');

function hashPassword(password, familyId) {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(`${familyId}:${password.toLowerCase()}`)
    .digest('hex');
}

function requireBookPassword(req, res, next) {
  if (!req.family) {
    return res.status(404).render('book/not-found');
  }

  const cookieName = `book_${req.family.id}`;
  const cookie = req.cookies?.[cookieName];
  const expected = hashPassword(req.family.book_password, req.family.id);

  if (cookie === expected) {
    return next();
  }

  // No valid cookie — show password screen
  res.render('book/password', { family: req.family, error: false });
}

module.exports = { requireBookPassword, hashPassword };
