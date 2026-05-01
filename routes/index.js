const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const assetService = require('../services/asset.service');
const assignmentSvc = require('../services/assignment.service');
const reportService = require('../services/report.service');
const Asset = require('../models/Asset.model');
const User = require('../models/User.model');
const ApiKey = require('../models/ApiKey.model');
const AuditLog = require('../models/AuditLog.model');
const Assignment = require('../models/Assignment.model');

const router = express.Router();

function formatDuration(diffDays) {
  if (diffDays < 365) return `${diffDays} days`;
  const years = Math.floor(diffDays / 365);
  const remainingDays = diffDays % 365;
  const yearLabel = years === 1 ? '1 year' : `${years} years`;
  return remainingDays === 0 ? yearLabel : `${yearLabel} and ${remainingDays} days`;
}

const getAssignableUsers = () =>
  User.find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
    .sort({ name: 1 })
    .select('name email')
    .lean();

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

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

// ── Dashboard ─────────────────────────────────────────────────────
router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const { totals, byCategory } = await reportService.inventoryStatus();

    const total = totals.total || 0;
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

    let recentActivity = [];
    try {
      const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('performedBy', 'name')
        .populate('asset', 'itemId')
        .lean();
      const allUsers = await User.find().select('name').lean();
      const userMap = allUsers.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u.name }), {});

      recentActivity = logs.map(l => {
        let description = l.description || l.action;
        
        // Resolve raw IDs in descriptions to actual names
        const idMatch = description.match(/([a-f\d]{24})/i);
        if (idMatch && userMap[idMatch[1]]) {
          description = description.replace(idMatch[1], userMap[idMatch[1]]);
        }
        // Clean up text
        description = description.replace('Checked out to user', 'Checked out to');
        
        const typeMap = {
          'checked_out': { id: 'checkout', label: 'Check Out' },
          'checked_in': { id: 'checkin', label: 'Check In' },
          'asset_created': { id: 'asset-create', label: 'Asset Created' },
          'asset_updated': { id: 'asset-update', label: 'Asset Updated' },
          'asset_deleted': { id: 'asset-delete', label: 'Asset Deleted' },
          'maintenance_requested': { id: 'maintenance', label: 'Maintenance Requested' },
          'maintenance_completed': { id: 'maintenance', label: 'Maintenance Completed' }
        };
        const typeInfo = typeMap[l.action] || { id: 'info', label: l.action };

        return {
          type: typeInfo.id,
          label: typeInfo.label,
          description,
          user: l.performedBy?.name || 'System',
          timestamp: l.createdAt,
          icon: typeInfo.id === 'checkout' ? 'fa-sign-out-alt'
            : typeInfo.id === 'checkin' ? 'fa-sign-in-alt'
            : typeInfo.id === 'asset-delete' ? 'fa-trash'
            : typeInfo.id === 'asset-create' ? 'fa-plus-circle'
            : typeInfo.id === 'asset-update' ? 'fa-edit'
            : typeInfo.id === 'maintenance' ? 'fa-tools'
            : 'fa-circle',
        };
      });
    } catch (_) {}

    res.render('dashboard/index', {
      layout: 'main',
      pageTitle: 'Dashboard',
      user: req.user,
      stats: {
        totalAssets: total,
        availableAssets: totals.available,
        assignedAssets: totals.inUse,
        maintenanceAssets: totals.maintenance,
        assetsChange: 0,
        availablePercentage: pct(totals.available),
        assignedPercentage: pct(totals.inUse),
      },
      categoryLabels: byCategory.map(c => c.category),
      categoryData: byCategory.map(c => c.total),
      statusLabels: ['Available', 'In-Use', 'Maintenance', 'Retired'],
      statusData: [totals.available, totals.inUse, totals.maintenance, totals.retired],
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

// ── Assets ────────────────────────────────────────────────────────
// /assets/new must come before /assets/:id
router.get('/assets/new', requireAuth, async (req, res, next) => {
  try {
    const userOptions = await getAssignableUsers();
    res.render('assets/form', {
      layout: 'main',
      pageTitle: 'Add New Asset',
      user: req.user,
      userOptions,
      selectedAssignedTo: '',
    });
  } catch (err) {
    next(err);
  }
});

// Compatibility routes for old bookmarked/API-form URLs
router.get('/api/items/:id', requireAuth, (req, res) => {
  res.redirect(`/assets/${req.params.id}/edit`);
});

router.get('/api/items/:id/edit', requireAuth, (req, res) => {
  res.redirect(`/assets/${req.params.id}/edit`);
});

router.post('/api/items/:id', requireAuth, (req, res) => {
  res.redirect(307, `/assets/${req.params.id}`);
});

router.post('/assets', requireAuth, async (req, res, next) => {
  try {
    const userOptions = await getAssignableUsers();
    const isInUse = req.body.status === 'In-Use';
    const assignedTo = req.body.assignedTo;

    if (isInUse && !assignedTo) {
      return res.status(422).render('assets/form', {
        layout: 'main',
        pageTitle: 'Add New Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: '',
        asset: {
          ...req.body,
          assetId: req.body.itemId || req.body.assetId,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: 'Please select the user currently using this asset.',
      });
    }

    const payload = { ...req.body };
    delete payload.assignedTo;
    if (isInUse) payload.status = 'Available';

    const asset = await assetService.createAsset(payload);

    if (isInUse && assignedTo) {
      await assignmentSvc.checkout({
        assetId: asset._id,
        assignedTo,
        assignedBy: req.user.sub,
        notes: payload.notes,
        condition: 'Good',
        ipAddress: req.ip,
      });
    }

    res.redirect(`/assets?success=1&message=${encodeURIComponent('Asset has been added successfully.')}`);
  } catch (err) {
    const userOptions = await getAssignableUsers();
    if (err.name === 'ValidationError') {
      return res.status(422).render('assets/form', {
        layout: 'main',
        pageTitle: 'Add New Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: req.body.assignedTo || '',
        asset: {
          ...req.body,
          assetId: req.body.itemId || req.body.assetId,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: Object.values(err.errors)[0]?.message || 'Validation failed',
      });
    }

    if (err.code === 11000) {
      return res.status(409).render('assets/form', {
        layout: 'main',
        pageTitle: 'Add New Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: req.body.assignedTo || '',
        asset: {
          ...req.body,
          assetId: req.body.itemId || req.body.assetId,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: `${Object.keys(err.keyPattern)[0]} already exists`,
      });
    }

    next(err);
  }
});

router.post('/assets/:id', requireAuth, async (req, res, next) => {
  try {
    const existingAsset = await assetService.getAssetById(req.params.id);
    if (!existingAsset) return res.status(404).render('errors/404', { layout: 'main', pageTitle: 'Not Found' });

    const isInUse = req.body.status === 'In-Use';
    const assignedTo = req.body.assignedTo;
    const userOptions = await getAssignableUsers();

    if (isInUse && !assignedTo) {
      return res.status(422).render('assets/form', {
        layout: 'main',
        pageTitle: 'Edit Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: '',
        asset: {
          ...req.body,
          _id: req.params.id,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: 'Please select the user currently using this asset.',
      });
    }

    const payload = { ...req.body };
    delete payload.assignedTo;
    if (payload.assetId && !payload.itemId) {
      payload.itemId = payload.assetId;
      delete payload.assetId;
    }
    if (isInUse && existingAsset.status !== 'In-Use') {
      payload.status = 'Available';
    }

    const asset = await assetService.updateAsset(req.params.id, payload);

    if (isInUse && existingAsset.status !== 'In-Use' && assignedTo) {
      await assignmentSvc.checkout({
        assetId: req.params.id,
        assignedTo,
        assignedBy: req.user.sub,
        notes: payload.notes,
        condition: 'Good',
        ipAddress: req.ip,
      });
    }

    res.redirect(`/assets?success=1&message=${encodeURIComponent('Asset has been updated successfully.')}`);
  } catch (err) {
    const userOptions = await getAssignableUsers();
    if (err.name === 'ValidationError') {
      return res.status(422).render('assets/form', {
        layout: 'main',
        pageTitle: 'Edit Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: req.body.assignedTo || '',
        asset: {
          ...req.body,
          _id: req.params.id,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: Object.values(err.errors)[0]?.message || 'Validation failed',
      });
    }

    if (err.code === 11000) {
      return res.status(409).render('assets/form', {
        layout: 'main',
        pageTitle: 'Edit Asset',
        user: req.user,
        userOptions,
        selectedAssignedTo: req.body.assignedTo || '',
        asset: {
          ...req.body,
          _id: req.params.id,
          itemId: req.body.itemId || req.body.assetId,
        },
        formError: `${Object.keys(err.keyPattern)[0]} already exists`,
      });
    }

    next(err);
  }
});

router.get('/assets/result', requireAuth, (req, res) => {
  const status = req.query.status === 'declined' ? 'declined' : 'success';
  res.render('assets/result', {
    layout: 'main',
    pageTitle: status === 'success' ? 'Asset Created' : 'Asset Creation Declined',
    user: req.user,
    status,
    message: req.query.message || '',
  });
});

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
    const [asset, userOptions, latestCheckout] = await Promise.all([
      assetService.getAssetById(req.params.id),
      getAssignableUsers(),
      Assignment.findOne({ asset: req.params.id, eventType: 'checkout' })
        .sort({ checkoutDate: -1, createdAt: -1 })
        .select('assignedTo')
        .lean(),
    ]);
    if (!asset) return res.status(404).render('errors/404', { layout: 'main', pageTitle: 'Not Found' });
    res.render('assets/form', {
      layout: 'main',
      pageTitle: 'Edit Asset',
      user: req.user,
      asset,
      userOptions,
      selectedAssignedTo: asset.status === 'In-Use' && latestCheckout?.assignedTo
        ? String(latestCheckout.assignedTo)
        : '',
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
        ? { user: open.assignedTo, checkoutDate: open.checkoutDate, documentPath: open.documentPath }
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
        ? { user: open.assignedTo, checkoutDate: open.checkoutDate, documentPath: open.documentPath }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// ── Assignments ───────────────────────────────────────────────────
// Named routes before the index so Express doesn't treat them as IDs
router.get('/assignments/checkout', requireAuth, async (req, res, next) => {
  try {
    const [assetOptions, userOptions] = await Promise.all([
      Asset.find({ status: 'Available', isDeleted: false })
        .sort({ itemId: 1 })
        .select('itemId brand model serialNumber status')
        .lean(),
      User.find({ $or: [{ isActive: true }, { isActive: { $exists: false } }] })
        .sort({ name: 1 })
        .select('name email role')
        .lean(),
    ]);

    res.render('assignments/checkout', {
      layout: 'main',
      pageTitle: 'Check Out Asset',
      user: req.user,
      assetOptions,
      userOptions,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments/checkin', requireAuth, async (req, res, next) => {
  try {
    const assets = await Asset.find({ status: 'In-Use', isDeleted: false })
      .sort({ itemId: 1 })
      .lean();

    const assignedAssets = await Promise.all(assets.map(async (asset) => {
      const assignment = await Assignment.findOne({ 
        asset: asset._id, 
        eventType: 'checkout', 
        checkinDate: null 
      })
      .sort({ checkoutDate: -1, createdAt: -1 })
      .populate('assignedTo', 'name email')
      .lean();

      return {
        ...asset,
        assignment: assignment ? { user: assignment.assignedTo } : null
      };
    }));

    res.render('assignments/checkin', {
      layout: 'main',
      pageTitle: 'Check In Asset',
      user: req.user,
      assignedAssets,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/assignments', requireAuth, async (req, res, next) => {
  try {
    const assignments = await Asset.aggregate([
      { $match: { status: 'In-Use', isDeleted: false } },
      {
        $lookup: {
          from: 'assignments',
          let: { assetId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$asset', '$$assetId'] },
                    { $eq: ['$eventType', 'checkout'] },
                  ],
                },
              },
            },
            { $sort: { checkoutDate: -1, createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: 'users',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
              },
            },
            { $unwind: '$assignedTo' },
            {
              $lookup: {
                from: 'users',
                localField: 'assignedBy',
                foreignField: '_id',
                as: 'assignedBy',
              },
            },
            { $unwind: { path: '$assignedBy', preserveNullAndEmptyArrays: true } },
          ],
          as: 'assignment',
        },
      },
      { $unwind: { path: '$assignment', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          asset: {
            _id: '$_id',
            itemId: '$itemId',
            serialNumber: '$serialNumber',
            brand: '$brand',
            model: '$model',
            category: '$category',
            status: '$status',
          },
          assignedTo: { $ifNull: ['$assignment.assignedTo', { name: 'Unknown User', email: 'N/A' }] },
          assignedBy: { $ifNull: ['$assignment.assignedBy', { name: 'System' }] },
          checkoutDate: { $ifNull: ['$assignment.checkoutDate', '$updatedAt'] },
          expectedReturnDate: '$assignment.expectedReturnDate',
          purpose: { $ifNull: ['$assignment.purpose', 'System Auto-Status'] },
          condition: { $ifNull: ['$assignment.condition', 'Good'] },
          notes: '$assignment.notes',
          documentPath: '$assignment.documentPath',
        },
      },
      { $sort: { checkoutDate: -1 } },
    ]);

    const withDuration = assignments.map(a => {
      if (!a.checkoutDate) return { ...a, durationText: 'Unknown' };
      
      const checkoutDate = new Date(a.checkoutDate);
      checkoutDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today - checkoutDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      const durationText = formatDuration(diffDays);

      return { ...a, durationText };
    });

    res.render('assignments/index', {
      layout: 'main',
      pageTitle: 'Assignments',
      user: req.user,
      assignments: withDuration,
    });
  } catch (err) {
    next(err);
  }
});

// ── Users ─────────────────────────────────────────────────────────
router.get('/users', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const users = await User.find().lean();
    res.render('users/index', {
      layout: 'main',
      pageTitle: 'User Management',
      user: req.user,
      users,
      additionalScripts: '<script src="/js/users.js"></script>',
    });
  } catch (err) {
    next(err);
  }
});

// ── Reports ───────────────────────────────────────────────────────
router.get('/reports', requireAuth, (req, res) => res.redirect('/reports/status'));

router.get('/reports/status', requireAuth, async (req, res, next) => {
  try {
    const [statusData, auditLogs] = await Promise.all([
      reportService.inventoryStatus(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('performedBy', 'name email role')
        .populate('asset', 'itemId brand model serialNumber')
        .lean()
    ]);

    const allUsers = await User.find().select('name').lean();
    const userMap = allUsers.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u.name }), {});

    const recentActivity = auditLogs.map(l => {
      let description = l.description || l.action;
      const idMatch = description.match(/([a-f\d]{24})/i);
      if (idMatch && userMap[idMatch[1]]) {
        description = description.replace(idMatch[1], userMap[idMatch[1]]);
      }
      description = description.replace('Checked out to user', 'Checked out to');

      const typeMap = {
        'checked_out': { id: 'checkout', label: 'Check Out' },
        'checked_in': { id: 'checkin', label: 'Check In' },
        'asset_created': { id: 'asset-create', label: 'Asset Created' },
        'asset_updated': { id: 'asset-update', label: 'Asset Updated' },
        'asset_deleted': { id: 'asset-delete', label: 'Asset Deleted' },
        'maintenance_requested': { id: 'maintenance', label: 'Maintenance Requested' },
        'maintenance_completed': { id: 'maintenance', label: 'Maintenance Completed' }
      };
      const typeInfo = typeMap[l.action] || { id: 'info', label: l.action };

      return {
        ...l,
        type: typeInfo.id,
        label: typeInfo.label,
        description,
        performedBy: l.performedBy || { name: 'System' },
        timestamp: l.createdAt,
        icon: typeInfo.id === 'checkout' ? 'fa-sign-out-alt'
          : typeInfo.id === 'checkin' ? 'fa-sign-in-alt'
          : typeInfo.id === 'asset-delete' ? 'fa-trash'
          : typeInfo.id === 'asset-create' ? 'fa-plus-circle'
          : typeInfo.id === 'asset-update' ? 'fa-edit'
          : typeInfo.id === 'maintenance' ? 'fa-tools'
          : 'fa-circle',
      };
    });

    res.render('reports/index', {
      layout: 'main',
      pageTitle: 'Reports — Status',
      user: req.user,
      reportType: 'status',
      report: {
        ...statusData.totals,
        byCategory: statusData.byCategory.map(c => ({ ...c, count: c.total })),
        recentActivity
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
          assets: data.assignedAssets.map(a => {
            const checkoutDate = a.checkoutDate ? new Date(a.checkoutDate) : null;
            let durationText = 'Unknown';
            if (checkoutDate) {
              const start = new Date(checkoutDate);
              start.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const diffDays = Math.round((today - start) / (1000 * 60 * 60 * 24));
              durationText = formatDuration(diffDays);
            }
            return {
              ...a.asset,
              assetId: a.asset.itemId,
              checkoutDate,
              expectedReturnDate: a.expectedReturnDate,
              durationText,
            };
          }),
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

// ── API Keys ──────────────────────────────────────────────────────
router.get('/api-keys', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const keys = await ApiKey.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
    const users = await User.find().select('name email').lean();
    res.render('api-keys/index', {
      layout: 'main',
      pageTitle: 'API Keys',
      user: req.user,
      activePage: 'api-keys',
      keys,
      users,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/api-keys/new', requireAuth, requireRole('Admin'), async (req, res, next) => {
  try {
    const users = await User.find().select('name email').lean();
    res.render('api-keys/generate', {
      layout: 'main',
      pageTitle: 'Generate API Key',
      user: req.user,
      activePage: 'api-keys',
      users,
    });
  } catch (err) {
    next(err);
  }
});

// ── Maintenance ───────────────────────────────────────────────────
router.get('/maintenance', (req, res) => res.redirect('/maintenance/request'));

router.get('/maintenance/request', requireAuth, async (req, res, next) => {
  try {
    const Asset = require('../models/Asset.model');
    const Maintenance = require('../models/Maintenance.model');

    const pendingRecords = await Maintenance.find({ status: { $ne: 'Completed' } }).select('asset').lean();
    const pendingAssetIds = pendingRecords.map(r => r.asset.toString());

    const assets = await Asset.find({ 
      status: 'Maintenance', 
      isDeleted: false,
      _id: { $nin: pendingAssetIds }
    }).select('itemId brand model').lean();

    res.render('maintenance/request', {
      layout: 'main',
      pageTitle: 'Request Maintenance',
      user: req.user,
      activePage: 'maintenance-request',
      assets,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/maintenance/history', requireAuth, async (req, res, next) => {
  try {
    const Maintenance = require('../models/Maintenance.model');

    const records = await Maintenance.find()
      .sort({ createdAt: -1 })
      .populate('asset', 'itemId serialNumber brand model')
      .populate('requestedBy', 'name email')
      .populate('assignedTechnician', 'name email')
      .lean();

    res.render('maintenance/history', {
      layout: 'main',
      pageTitle: 'Maintenance History',
      user: req.user,
      activePage: 'maintenance-history',
      records,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/api/search/suggestions', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const rx = new RegExp(q, 'i');
    
    // Find matching assets
    const assets = await Asset.find({
      $or: [
        { itemId: rx },
        { serialNumber: rx },
        { brand: rx },
        { model: rx }
      ],
      isDeleted: false
    })
    .limit(5)
    .select('itemId brand model category')
    .lean();

    // Find matching users
    const users = await User.find({
      name: rx
    })
    .limit(5)
    .select('name email')
    .lean();

    const suggestions = [
      ...assets.map(a => ({
        type: 'asset',
        id: a._id,
        title: a.itemId,
        subtitle: `${a.brand} ${a.model}`,
        icon: 'fa-laptop'
      })),
      ...users.map(u => ({
        type: 'user',
        id: u._id,
        title: u.name,
        subtitle: u.email,
        icon: 'fa-user'
      }))
    ];

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const data = await reportService.inventoryStatus();
    res.json({
      categoryLabels: data.byCategory.map(c => c.category),
      categoryData: data.byCategory.map(c => c.total),
      statusLabels: ['Available', 'In-Use', 'Maintenance', 'Retired'],
      statusData: [data.totals.available, data.totals.inUse, data.totals.maintenance, data.totals.retired]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
