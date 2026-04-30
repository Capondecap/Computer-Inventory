const Asset = require('../models/Asset.model');
const { paginate, paginationMeta } = require('../utils/pagination');

const buildFilter = (query) => {
  const filter = {};

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.classification) filter.classification = query.classification;

  if (query.search) {
    const rx = new RegExp(query.search, 'i');
    filter.$or = [
      { itemId: rx },
      { serialNumber: rx },
      { brand: rx },
      { model: rx },
    ];
  }

  return filter;
};

const listAssets = async (query) => {
  const { page, limit, skip } = paginate(query);
  const filter = buildFilter(query);

  const [assets, total] = await Promise.all([
    Asset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Asset.countDocuments(filter),
  ]);

  return { assets, meta: paginationMeta(total, page, limit) };
};

const getAssetById = async (id) => {
  return Asset.findById(id);
};

const createAsset = async (data) => {
  return Asset.create(data);
};

const updateAsset = async (id, data) => {
  // run validators and trigger pre-save hooks
  const asset = await Asset.findById(id);
  if (!asset) return null;

  Object.assign(asset, data);
  return asset.save();
};

const softDeleteAsset = async (id) => {
  const asset = await Asset.findById(id);
  if (!asset) return null;
  return asset.softDelete();
};

module.exports = { listAssets, getAssetById, createAsset, updateAsset, softDeleteAsset };
