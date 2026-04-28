const Maintenance = require('../models/Maintenance.model');
const Asset = require('../models/Asset.model');
// audit.service is owned by Person 3 — shared utility, do not modify
const auditService = require('./audit.service');

async function createMaintenance({ assetId, requestedById, description, cost }) {
  const asset = await Asset.findById(assetId);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  if (['Retired'].includes(asset.status)) {
    throw Object.assign(new Error('Retired assets cannot be placed into maintenance'), { statusCode: 400 });
  }

  const record = await Maintenance.create({
    asset: assetId,
    requestedBy: requestedById,
    description,
    cost,
  });

  asset.status = 'Maintenance';
  await asset.save();

  await auditService.log({
    actor: requestedById,
    action: 'MAINTENANCE_CREATED',
    target: assetId,
    targetModel: 'Asset',
    detail: `Maintenance record created for asset ${asset.itemId}: ${description}`,
  });

  return record;
}

async function updateMaintenance(id, { status, resolutionNotes, cost }, actorId) {
  const record = await Maintenance.findById(id).populate('asset');
  if (!record) throw Object.assign(new Error('Maintenance record not found'), { statusCode: 404 });

  if (status) record.status = status;
  if (resolutionNotes) record.resolutionNotes = resolutionNotes;
  if (cost !== undefined) record.cost = cost;

  if (status === 'Completed') {
    record.completedDate = new Date();
    await Asset.findByIdAndUpdate(record.asset._id, { status: 'Available' });
  }

  await record.save();

  await auditService.log({
    actor: actorId,
    action: 'MAINTENANCE_UPDATED',
    target: record.asset._id,
    targetModel: 'Asset',
    detail: `Maintenance record ${id} updated to status: ${record.status}`,
  });

  return record;
}

async function listMaintenance({ assetId, status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (assetId) filter.asset = assetId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Maintenance.find(filter)
      .populate('asset', 'itemId model brand category')
      .populate('requestedBy', 'name email')
      .sort('-startDate')
      .skip(skip)
      .limit(Number(limit)),
    Maintenance.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), pages: Math.ceil(total / limit) };
}

async function getMaintenanceById(id) {
  const record = await Maintenance.findById(id)
    .populate('asset')
    .populate('requestedBy', 'name email role');
  if (!record) throw Object.assign(new Error('Maintenance record not found'), { statusCode: 404 });
  return record;
}

module.exports = { createMaintenance, updateMaintenance, listMaintenance, getMaintenanceById };
