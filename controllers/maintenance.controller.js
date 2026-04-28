const maintenanceService = require('../services/maintenance.service');

// ─── API handlers ─────────────────────────────────────────────────────────────
exports.apiListMaintenance = async (req, res, next) => {
  try {
    const result = await maintenanceService.listMaintenance(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.apiGetMaintenance = async (req, res, next) => {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.apiCreateMaintenance = async (req, res, next) => {
  try {
    const { assetId, description, cost } = req.body;
    const record = await maintenanceService.createMaintenance({
      assetId,
      requestedById: req.user._id,
      description,
      cost,
    });
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

exports.apiUpdateMaintenance = async (req, res, next) => {
  try {
    const record = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// ─── UI (HBS) handlers ────────────────────────────────────────────────────────
exports.uiListMaintenance = async (req, res, next) => {
  try {
    const result = await maintenanceService.listMaintenance({ ...req.query, limit: 15 });
    res.render('maintenance/index', {
      title: 'Maintenance',
      ...result,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

exports.uiNewMaintenanceForm = (req, res) => {
  res.render('maintenance/form', {
    title: 'Log Maintenance',
    record: null,
    assetId: req.query.assetId,
  });
};

exports.uiEditMaintenanceForm = async (req, res, next) => {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    res.render('maintenance/form', { title: 'Update Maintenance', record });
  } catch (err) {
    next(err);
  }
};

exports.uiCreateMaintenance = async (req, res, next) => {
  try {
    const { assetId, description, cost } = req.body;
    await maintenanceService.createMaintenance({
      assetId,
      requestedById: req.user._id,
      description,
      cost,
    });
    req.flash('success', 'Maintenance record created.');
    res.redirect(`/assets/${assetId}`);
  } catch (err) {
    if (err.statusCode === 400) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    next(err);
  }
};

exports.uiUpdateMaintenance = async (req, res, next) => {
  try {
    const record = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user._id);
    req.flash('success', 'Maintenance record updated.');
    res.redirect(`/assets/${record.asset._id || record.asset}`);
  } catch (err) {
    if (err.statusCode === 400) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    next(err);
  }
};
