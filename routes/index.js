const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/auth/login'));

router.get('/auth/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/login', { layout: 'auth', pageTitle: 'Login' });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

router.get('/dashboard', requireAuth, (req, res) =>
  res.render('dashboard/index', {
    layout: 'main',
    pageTitle: 'Dashboard',
    user: req.user,
    stats: {
      totalAssets: 0,
      availableAssets: 0,
      assignedAssets: 0,
      maintenanceAssets: 0,
      assetsChange: 0,
      availablePercentage: 0,
      assignedPercentage: 0,
    },
    categoryLabels: [],
    categoryData: [],
    statusLabels: [],
    statusData: [],
  })
);

// Admin UI — Admin only
router.get('/admin', requireAuth, requireRole('Admin'), (req, res) =>
  res.render('admin/index', {
    layout: 'main',
    pageTitle: 'Admin',
    user: req.user,
  })
);

// Admin API — Admin only
router.get('/api/admin/users', requireAuth, requireRole('Admin'), (req, res) =>
  res.json({ success: true, data: [] })
);

// Technician + Admin shared API example
router.get(
  '/api/assets',
  requireAuth,
  requireRole('Admin', 'Technician'),
  (req, res) => res.json({ success: true, data: [] })
);

module.exports = router;
