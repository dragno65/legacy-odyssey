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

  // If no password is set, allow access without password
  if (!req.family.book_password) {
    return next();
  }

  // Check for valid mobile app preview token in query string
  // (allows authenticated app users to bypass the password page)
  if (req.query.app_token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(req.query.app_token, process.env.JWT_SECRET);
      if (decoded && decoded.familyId === req.family.id) {
        return next(); // Valid app token, bypass password
      }
    } catch (e) {
      // Invalid token, fall through to password check
    }
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
