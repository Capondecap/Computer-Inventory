const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }

  if (!roles.includes(req.user.role)) {
    const wantsJson =
      req.originalUrl.startsWith('/api/') ||
      req.headers.accept?.includes('application/json');

    if (wantsJson) {
      const err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }

    return res.redirect('/dashboard');
  }

  next();
};

module.exports = requireRole;
