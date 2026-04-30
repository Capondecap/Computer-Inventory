const maintenanceSvc = require('../services/maintenance.service');

const get = async (req, res, next) => {
  try {
    const Maintenance = require('../models/Maintenance.model');
    const record = await Maintenance.findById(req.params.id)
      .populate('asset', 'itemId serialNumber brand model')
      .populate('requestedBy', 'name email')
      .populate('assignedTechnician', 'name email');

    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const list = async (req, res, next) => {
  try {
    const records = await maintenanceSvc.listMaintenance(req.query);
    res.json({ success: true, data: records });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { assetId, type, priority, description } = req.body;

    if (!assetId || !type || !description) {
      return res.status(400).json({ success: false, message: 'assetId, type, and description are required' });
    }

    const record = await maintenanceSvc.createMaintenance({
      assetId,
      type,
      priority,
      description,
      requestedBy: req.user.sub,
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const record = await maintenanceSvc.updateMaintenance(req.params.id, req.body);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const complete = async (req, res, next) => {
  try {
    const { resolution, newAssetStatus } = req.body;
    const record = await maintenanceSvc.completeMaintenance(req.params.id, resolution, req.user.sub, newAssetStatus);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const Maintenance = require('../models/Maintenance.model');
    const record = await Maintenance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { get, list, create, update, complete, remove };
