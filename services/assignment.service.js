const Assignment = require('../models/Assignment.model');
const Asset = require('../models/Asset.model');
// audit.service is owned by Person 3 — shared utility, do not modify
const auditService = require('./audit.service');

async function checkoutAsset({ assetId, assignedToId, assignedById, notes, document }) {
  const asset = await Asset.findById(assetId);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  if (asset.status !== 'Available') {
    throw Object.assign(
      new Error(`Asset cannot be checked out. Current status: ${asset.status}`),
      { statusCode: 400 }
    );
  }

  const docMeta = document
    ? {
        filename: document.filename,
        originalName: document.originalname,
        path: document.path,
        mimetype: document.mimetype,
        size: document.size,
      }
    : undefined;

  const assignment = await Assignment.create({
    asset: assetId,
    assignedTo: assignedToId,
    assignedBy: assignedById,
    checkoutNotes: notes,
    checkoutDocument: docMeta,
  });

  asset.status = 'In-Use';
  asset.assignedTo = assignedToId;
  await asset.save();

  await auditService.log({
    actor: assignedById,
    action: 'ASSET_CHECKOUT',
    target: assetId,
    targetModel: 'Asset',
    detail: `Asset ${asset.itemId} checked out to user ${assignedToId}`,
  });

  return assignment.populate([
    { path: 'asset' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'assignedBy', select: 'name email' },
  ]);
}

async function checkinAsset({ assetId, returnedById, notes, document }) {
  const asset = await Asset.findById(assetId);
  if (!asset) throw Object.assign(new Error('Asset not found'), { statusCode: 404 });

  if (asset.status !== 'In-Use') {
    throw Object.assign(
      new Error(`Asset is not currently checked out. Status: ${asset.status}`),
      { statusCode: 400 }
    );
  }

  const assignment = await Assignment.findOne({ asset: assetId, status: 'Active' });
  if (!assignment) {
    throw Object.assign(new Error('No active assignment found for this asset'), { statusCode: 400 });
  }

  const docMeta = document
    ? {
        filename: document.filename,
        originalName: document.originalname,
        path: document.path,
        mimetype: document.mimetype,
        size: document.size,
      }
    : undefined;

  assignment.status = 'Returned';
  assignment.checkinDate = new Date();
  assignment.checkinNotes = notes;
  if (docMeta) assignment.checkinDocument = docMeta;
  await assignment.save();

  asset.status = 'Available';
  asset.assignedTo = null;
  await asset.save();

  await auditService.log({
    actor: returnedById,
    action: 'ASSET_CHECKIN',
    target: assetId,
    targetModel: 'Asset',
    detail: `Asset ${asset.itemId} returned by user ${assignment.assignedTo}`,
  });

  return assignment.populate([
    { path: 'asset' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'assignedBy', select: 'name email' },
  ]);
}

async function listAssignments({ assetId, userId, status, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (assetId) filter.asset = assetId;
  if (userId) filter.assignedTo = userId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Assignment.find(filter)
      .populate('asset', 'itemId model brand category')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort('-checkoutDate')
      .skip(skip)
      .limit(Number(limit)),
    Assignment.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), pages: Math.ceil(total / limit) };
}

async function getAssignmentById(id) {
  const assignment = await Assignment.findById(id)
    .populate('asset')
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');
  if (!assignment) throw Object.assign(new Error('Assignment not found'), { statusCode: 404 });
  return assignment;
}

module.exports = { checkoutAsset, checkinAsset, listAssignments, getAssignmentById };
