const Maintenance = require('../models/Maintenance.model');
const auditSvc = require('./audit.service');

const listMaintenance = async (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const records = await Maintenance.find(filter)
    .sort({ createdAt: -1 })
    .populate('asset', 'itemId serialNumber brand model')
    .populate('requestedBy', 'name email')
    .populate('assignedTechnician', 'name email')
    .lean();

  return records;
};

const createMaintenance = async ({ assetId, type, priority, description, requestedBy, assignedTechnician }) => {
  const record = await Maintenance.create({
    asset: assetId,
    type,
    priority: priority || 'Medium',
    description,
    requestedBy,
    assignedTechnician: assignedTechnician || null,
    status: 'Pending',
  });

  await auditSvc.log({
    asset: assetId,
    performedBy: requestedBy,
    action: 'maintenance_requested',
    description: `Maintenance request: ${type}`,
    changes: { status: { to: 'Pending' } },
    relatedModel: 'Maintenance',
    relatedId: record._id,
  });

  return record;
};

const updateMaintenance = async (id, data) => {
  const record = await Maintenance.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('asset', 'itemId serialNumber brand model')
    .populate('requestedBy', 'name email')
    .populate('assignedTechnician', 'name email');

  return record;
};

const completeMaintenance = async (id, resolution, completedBy, newAssetStatus = 'Available') => {
  const record = await Maintenance.findByIdAndUpdate(
    id,
    { status: 'Completed', resolution, completedDate: new Date() },
    { new: true }
  );

  if (record) {
    // Update the asset status as requested
    const Asset = require('../models/Asset.model');
    await Asset.findByIdAndUpdate(record.asset, { status: newAssetStatus });

    await auditSvc.log({
      asset: record.asset,
      performedBy: completedBy,
      action: 'maintenance_completed',
      description: `Maintenance completed: ${record.type}. Asset set to ${newAssetStatus}.`,
      changes: { 
        maintenance: { to: 'Completed' },
        assetStatus: { to: newAssetStatus }
      },
      relatedModel: 'Maintenance',
      relatedId: record._id,
    });
  }

  return record;
};

module.exports = { listMaintenance, createMaintenance, updateMaintenance, completeMaintenance };
