const requireAuth = (req, res, next) => {
  if (req.user) return next();

  const wantsJson =
    req.originalUrl.startsWith('/api/') ||
    req.headers.accept?.includes('application/json');

  if (wantsJson) {
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }

  res.redirect('/auth/login');
};

module.exports = requireAuth;
