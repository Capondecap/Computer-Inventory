const Asset = require('../models/Asset.model');
const Assignment = require('../models/Assignment.model');
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

const getAssetHistory = async (id) => {
  const asset = await Asset.findById(id);
  if (!asset) return null;

  const records = await Assignment.find({ asset: id })
    .sort({ createdAt: 1 })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');

  // pair each checkout with the next checkin chronologically
  const history = [];
  let openCheckout = null;

  for (const r of records) {
    if (r.eventType === 'checkout') {
      openCheckout = r;
      history.push({
        eventType: 'checkout',
        assignedTo: r.assignedTo,
        assignedBy: r.assignedBy,
        checkoutDate: r.checkoutDate,
        expectedReturnDate: r.expectedReturnDate,
        purpose: r.purpose,
        condition: r.condition,
        notes: r.notes,
        documentPath: r.documentPath,
        checkinDate: null,
        durationDays: null,
      });
    } else if (r.eventType === 'checkin') {
      const last = history[history.length - 1];
      if (last && last.eventType === 'checkout') {
        last.checkinDate = r.checkinDate;
        last.notes = r.notes || last.notes;
        last.documentPath = r.documentPath || last.documentPath;

        if (openCheckout && r.checkinDate && openCheckout.checkoutDate) {
          const ms = r.checkinDate - openCheckout.checkoutDate;
          last.durationDays = Math.round(ms / (1000 * 60 * 60 * 24));
        }
      } else {
        // standalone checkin with no matching checkout in records
        history.push({
          eventType: 'checkin',
          assignedTo: r.assignedTo,
          assignedBy: r.assignedBy,
          checkinDate: r.checkinDate,
          condition: r.condition,
          notes: r.notes,
          documentPath: r.documentPath,
          durationDays: null,
        });
      }
      openCheckout = null;
    }
  }

  return { asset, history };
};

module.exports = { listAssets, getAssetById, createAsset, updateAsset, softDeleteAsset, getAssetHistory };
