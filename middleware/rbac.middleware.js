// usage: requireRole('Admin') or requireRole('Admin', 'Technician')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  next();
};

module.exports = { requireRole };
