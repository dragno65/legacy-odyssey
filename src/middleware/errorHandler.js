function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'
    : err.message;

  // API routes return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(status).json({ error: message });
  }

  // Web routes render error page
  res.status(status).render('book/error', { status, message });
}

module.exports = errorHandler;
