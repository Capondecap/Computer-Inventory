const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const assetService = require('../services/asset.service');
const reportService = require('../services/report.service');
const User = require('../models/User.model');

const router = express.Router();

// Build the pagination context expected by views/partials/pagination.hbs
function buildPagination(meta, rawQuery) {
  const qs = new URLSearchParams(rawQuery);
  qs.delete('page');
  const pages = [];
  for (let i = 1; i <= meta.totalPages; i++) {
    pages.push({ number: i, isCurrent: i === meta.page });
  }
  return {
    startItem: meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1,
    endItem: Math.min(meta.page * meta.limit, meta.total),
    totalItems: meta.total,
    hasPrevious: meta.hasPrev,
    previousPage: meta.page - 1,
    hasNext: meta.hasNext,
    nextPage: meta.page + 1,
    totalPages: meta.totalPages,
    pages,
    query: qs.toString(),
  };
}

// ── Auth ─────────────────────────────────────────────────────────
router.get('/', (req, res) => res.redirect('/auth/login'));

router.get('/auth/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.render('auth/login', { layout: 'auth', pageTitle: 'Login' });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

// ── Dashboard ─────────────────────────────────────────────────────
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

// ── Assets ────────────────────────────────────────────────────────
// /assets/new must come before /assets/:id
router.get('/assets/new', requireAuth, (req, res) =>
  res.render('assets/form', {
    layout: 'main',
    pageTitle: 'Add New Asset',
    user: req.user,
  })
);

router.get('/assets', requireAuth, async (req, res, next) => {
  try {
    const { assets, meta } = await assetService.listAssets(req.query);
    res.render('assets/index', {
      layout: 'main',
      pageTitle: 'Inventory',
      user: req.user,
      assets,
      query: req.query,
      pagination: buildPagination(meta, req.query),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assets/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    if (!asset) return res.status(404).render('errors/404', { layout: 'main', pageTitle: 'Not Found' });
    res.render('assets/form', {
      layout: 'main',
      pageTitle: 'Edit Asset',
      user: req.user,
      asset,
    });
  } catch (err) {
    next(err);
  }
});

// /assets/:id/history renders the detail view (history is inline in the template)
router.get('/assets/:id/history', requireAuth, async (req, res, next) => {
  try {
    const result = await assetService.getAssetHistory(req.params.id);
    if (!result) return res.status(404).render('errors/404', { layout: 'main', pageTitle: 'Not Found' });
    const open = result.history.find(h => h.eventType === 'checkout' && !h.checkinDate);
    res.render('assets/detail', {
      layout: 'main',
      pageTitle: `${result.asset.itemId} — History`,
      user: req.user,
      asset: result.asset,
      history: result.history,
      currentAssignment: open
        ? { user: open.assignedTo, checkoutDate: open.checkoutDate, document: open.documentPath }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assets/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await assetService.getAssetHistory(req.params.id);
    if (!result) return res.status(404).render('errors/404', { layout: 'main', pageTitle: 'Not Found' });
    const open = result.history.find(h => h.eventType === 'checkout' && !h.checkinDate);
    res.render('assets/detail', {
      layout: 'main',
      pageTitle: result.asset.itemId,
      user: req.user,
      asset: result.asset,
      history: result.history,
      currentAssignment: open
        ? { user: open.assignedTo, checkoutDate: open.checkoutDate, document: open.documentPath }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// ── Assignments ───────────────────────────────────────────────────
// Named routes before the index so Express doesn't treat them as IDs
router.get('/assignments/checkout', requireAuth, (req, res) =>
  res.render('assignments/checkout', {
    layout: 'main',
    pageTitle: 'Check Out Asset',
    user: req.user,
  })
);

router.get('/assignments/checkin', requireAuth, (req, res) =>
  res.render('assignments/checkin', {
    layout: 'main',
    pageTitle: 'Check In Asset',
    user: req.user,
  })
);

router.get('/assignments', requireAuth, (req, res) =>
  res.render('assignments/index', {
    layout: 'main',
    pageTitle: 'Assignments',
    user: req.user,
  })
);

// ── Users ─────────────────────────────────────────────────────────
router.get('/users', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const users = await User.find().lean();
    res.render('users/index', {
      layout: 'main',
      pageTitle: 'User Management',
      user: req.user,
      users,
    });
  } catch (err) {
    next(err);
  }
});

// ── Reports ───────────────────────────────────────────────────────
router.get('/reports', requireAuth, (req, res) => res.redirect('/reports/status'));

router.get('/reports/status', requireAuth, async (req, res, next) => {
  try {
    const data = await reportService.inventoryStatus();
    res.render('reports/index', {
      layout: 'main',
      pageTitle: 'Reports — Status',
      user: req.user,
      reportType: 'status',
      report: {
        ...data.totals,
        byCategory: data.byCategory.map(c => ({ ...c, count: c.total })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reports/aging', requireAuth, async (req, res, next) => {
  try {
    const threshold = Math.max(1, parseInt(req.query.threshold) || 3);
    const rawAssets = await reportService.assetAging(threshold);
    res.render('reports/index', {
      layout: 'main',
      pageTitle: 'Reports — Asset Aging',
      user: req.user,
      reportType: 'aging',
      report: {
        assets: rawAssets.map(a => ({ ...a, age: a.ageYears })),
      },
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/reports/user-audit', requireAuth, async (req, res, next) => {
  try {
    const users = await User.find().select('name email').lean();
    let report = null;
    if (req.query.userId) {
      const data = await reportService.userAudit(req.query.userId);
      if (data) {
        report = {
          user: data.user,
          assets: data.assignedAssets.map(a => ({
            ...a.asset,
            assetId: a.asset.itemId,
            checkoutDate: a.checkoutDate,
            expectedReturnDate: a.expectedReturnDate,
          })),
        };
      }
    }
    res.render('reports/index', {
      layout: 'main',
      pageTitle: 'Reports — User Audit',
      user: req.user,
      reportType: 'user-audit',
      users,
      report,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
});

// ── Maintenance ───────────────────────────────────────────────────
router.get('/maintenance', requireAuth, (req, res) =>
  res.render('maintenance/index', {
    layout: 'main',
    pageTitle: 'Maintenance',
    user: req.user,
  })
);

module.exports = router;
