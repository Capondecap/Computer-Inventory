const Asset = require('../models/Asset.model');
const Assignment = require('../models/Assignment.model');
const crypto = require('crypto');
const { paginate, paginationMeta } = require('../utils/pagination');

const buildFilter = async (query) => {
  const filter = { isDeleted: false };

  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.classification) filter.classification = query.classification;

  if (query.search) {
    const searchTerms = query.search.trim().split(/\s+/);
    const regexes = searchTerms.map(term => new RegExp(term, 'i'));
    
    // Create an array of $or conditions for each term
    const termConditions = regexes.map(rx => ({
      $or: [
        { itemId: rx },
        { serialNumber: rx },
        { brand: rx },
        { model: rx },
        { category: rx },
        { notes: rx }
      ]
    }));

    // Find users whose names match the search term to include their assigned assets
    const matchingUsers = await require('../models/User.model').find({
      name: { $in: regexes }
    }).select('_id').lean();

    if (matchingUsers.length > 0) {
      const userIds = matchingUsers.map(u => u._id);
      // Find current assignments for these users
      const activeAssignments = await require('../models/Assignment.model').find({
        assignedTo: { $in: userIds },
        eventType: 'checkout',
        checkinDate: null
      }).select('asset').lean();

      if (activeAssignments.length > 0) {
        const assetIdsFromUsers = activeAssignments.map(a => a.asset);
        termConditions.push({ _id: { $in: assetIdsFromUsers } });
      }
    }

    // Combine all conditions - if multiple terms, all must match at least one field (AND of ORs)
    filter.$and = termConditions;
  }

  return filter;
};

const toView = (asset) => {
  const obj = asset.toObject ? asset.toObject() : { ...asset };
  obj.assetId = obj.itemId;
  return obj;
};

const generateItemId = async () => {
  for (let i = 0; i < 5; i += 1) {
    const itemId = `ASSET-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const existing = await Asset.findOne({ itemId }).select('_id').lean();
    if (!existing) return itemId;
  }
  throw Object.assign(new Error('Unable to generate a unique asset ID'), { status: 500 });
};

const listAssets = async (query) => {
  const { page, limit, skip } = paginate(query);
  const filter = await buildFilter(query);

  const [assets, total] = await Promise.all([
    Asset.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Asset.countDocuments(filter),
  ]);

  return { assets: assets.map(toView), meta: paginationMeta(total, page, limit) };
};

const getAssetById = async (id) => {
  const asset = await Asset.findById(id);
  return asset ? toView(asset) : null;
};

const createAsset = async (data) => {
  const body = { ...data };
  if (body.assetId && !body.itemId) {
    body.itemId = body.assetId;
    delete body.assetId;
  }
  if (!String(body.itemId || '').trim()) {
    body.itemId = await generateItemId();
  }
  return Asset.create(body);
};

const updateAsset = async (id, data) => {
  const asset = await Asset.findById(id);
  if (!asset) return null;

  const body = { ...data };
  if (body.assetId && !body.itemId) { body.itemId = body.assetId; delete body.assetId; }
  Object.assign(asset, body);
  const saved = await asset.save();
  return toView(saved);
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
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email')
    .lean();

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
        documentPath: r.documentPath ? (r.documentPath.includes('/') || r.documentPath.includes('\\') ? require('path').basename(r.documentPath) : r.documentPath) : null,
        checkinDate: null,
        durationDays: null,
      });
    } else if (r.eventType === 'checkin') {
      const last = history[history.length - 1];
      if (last && last.eventType === 'checkout') {
        last.checkinDate = r.checkinDate;
        last.notes = r.notes || last.notes;
        last.documentPath = (r.documentPath ? (r.documentPath.includes('/') || r.documentPath.includes('\\') ? require('path').basename(r.documentPath) : r.documentPath) : null) || last.documentPath;

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
          documentPath: r.documentPath ? (r.documentPath.includes('/') || r.documentPath.includes('\\') ? require('path').basename(r.documentPath) : r.documentPath) : null,
          durationDays: null,
        });
      }
      openCheckout = null;
    }
  }

  return { asset: toView(asset), history };
};

const searchAssets = async ({ q, status, limit = 10 }) => {
  const max = Math.min(5000, Math.max(1, parseInt(limit, 10) || 10));
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q, 'i');
    filter.$or = [
      { itemId: rx },
      { assetId: rx }, // legacy field support
      { serialNumber: rx },
      { brand: rx },
      { model: rx },
    ];
  }
  const assets = await Asset.find(filter).limit(max).lean();
  return assets.map(a => ({ ...a, assetId: a.itemId || a.assetId }));
};

module.exports = { listAssets, getAssetById, createAsset, updateAsset, softDeleteAsset, getAssetHistory, searchAssets };
