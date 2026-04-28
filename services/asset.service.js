const Asset = require('../models/Asset.model');
const Assignment = require('../models/Assignment.model');
// audit.service is owned by Person 3 — shared utility, do not modify
const auditService = require('./audit.service');

function buildFilter({ search, status, category, type }) {
  const filter = {};
  if (search) {
    const re = new RegExp(search, 'i');
    filter.$or = [{ itemId: re }, { serialNumber: re }, { model: re }, { brand: re }];
  }
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (type) filter.type = type;
  return filter;
}

async function listAssets({ search, status, category, type, page = 1, limit = 20, sort = '-createdAt' } = {}) {
  const filter = buildFilter({ search, status, category, type });
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Asset.find(filter).populate('assignedTo', 'name email').sort(sort).skip(skip).limit(Number(limit)),
    Asset.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
    limit: Number(limit),
  };
}

async function getAssetById(id) {
  const asset = await Asset.findById(id).populate('assignedTo', 'name email role');
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  return asset;
}

async function getAssetByItemId(itemId) {
  const asset = await Asset.findOne({ itemId }).populate('assignedTo', 'name email role');
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  return asset;
}

async function createAsset(data, actorId) {
  const asset = await Asset.create(data);
  await auditService.log({
    actor: actorId,
    action: 'ASSET_CREATED',
    target: asset._id,
    targetModel: 'Asset',
    detail: `Created asset ${asset.itemId}`,
  });
  return asset;
}

async function updateAsset(id, data, actorId) {
  const asset = await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  await auditService.log({
    actor: actorId,
    action: 'ASSET_UPDATED',
    target: asset._id,
    targetModel: 'Asset',
    detail: `Updated asset ${asset.itemId}`,
  });
  return asset;
}

async function deleteAsset(id, actorId) {
  const asset = await Asset.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });
  await auditService.log({
    actor: actorId,
    action: 'ASSET_DELETED',
    target: asset._id,
    targetModel: 'Asset',
    detail: `Soft-deleted asset ${asset.itemId}`,
  });
  return asset;
}

async function getAssetHistory(assetId) {
  const asset = await Asset.findById(assetId);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  const history = await Assignment.find({ asset: assetId })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .sort('-checkoutDate');

  return { asset, history };
}

async function getAgingAssets() {
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  return Asset.find({ dateAcquired: { $lte: threeYearsAgo } })
    .populate('assignedTo', 'name email')
    .sort('dateAcquired');
}

async function getInventorySummary() {
  const statuses = ['Available', 'In-Use', 'Maintenance', 'Retired'];
  const results = await Asset.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const summary = Object.fromEntries(statuses.map((s) => [s, 0]));
  results.forEach(({ _id, count }) => {
    if (_id in summary) summary[_id] = count;
  });
  summary.total = Object.values(summary).reduce((a, b) => a + b, 0);
  return summary;
}

async function getAssetsByUser(userId) {
  return Asset.find({ assignedTo: userId, status: 'In-Use' }).sort('category');
}

module.exports = {
  listAssets,
  getAssetById,
  getAssetByItemId,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetHistory,
  getAgingAssets,
  getInventorySummary,
  getAssetsByUser,
};
