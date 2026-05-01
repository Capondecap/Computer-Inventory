const Asset = require('../models/Asset.model');
const Assignment = require('../models/Assignment.model');
const User = require('../models/User.model');

const inventoryStatus = async () => {
  const summary = await Asset.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
        inUse: { $sum: { $cond: [{ $eq: ['$status', 'In-Use'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] } },
        retired: { $sum: { $cond: [{ $eq: ['$status', 'Retired'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        available: 1,
        inUse: 1,
        maintenance: 1,
        retired: 1,
      },
    },
  ]);

  const totals = summary.reduce(
    (acc, row) => {
      acc.total += row.total;
      acc.available += row.available;
      acc.inUse += row.inUse;
      acc.maintenance += row.maintenance;
      acc.retired += row.retired;
      return acc;
    },
    { total: 0, available: 0, inUse: 0, maintenance: 0, retired: 0 }
  );

  return { totals, byCategory: summary };
};

const assetAging = async (years = 3) => {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  const assets = await Asset.find({ dateAcquired: { $lte: cutoff } })
    .sort({ dateAcquired: 1 })
    .select('itemId serialNumber brand model category status dateAcquired');

  return assets.map((a) => {
    const ms = Date.now() - new Date(a.dateAcquired).getTime();
    const ageYears = parseFloat((ms / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));
    return { ...a.toObject(), ageYears };
  });
};

const userAudit = async (userId) => {
  const user = await User.findById(userId).select('name email role');
  if (!user) return null;

  // find assets currently checked out to this user
  // an asset is "currently assigned" if its last assignment record is a checkout
  const checkouts = await Assignment.aggregate([
    { $match: { assignedTo: user._id, eventType: 'checkout' } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$asset',
        lastCheckout: { $first: '$$ROOT' },
      },
    },
    // check if a checkin exists after this checkout
    {
      $lookup: {
        from: 'assignments',
        let: { assetId: '$_id', checkoutDate: '$lastCheckout.createdAt' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$asset', '$$assetId'] },
                  { $eq: ['$eventType', 'checkin'] },
                  { $gt: ['$createdAt', '$$checkoutDate'] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: 'returnedAfter',
      },
    },
    // keep only assets with no checkin after the last checkout
    { $match: { returnedAfter: { $size: 0 } } },
    {
      $lookup: {
        from: 'assets',
        localField: '_id',
        foreignField: '_id',
        as: 'asset',
      },
    },
    { $unwind: '$asset' },
    { $match: { 'asset.isDeleted': false } },
    {
      $project: {
        _id: 0,
        asset: {
          _id: '$asset._id',
          itemId: '$asset.itemId',
          serialNumber: '$asset.serialNumber',
          brand: '$asset.brand',
          model: '$asset.model',
          category: '$asset.category',
          status: '$asset.status',
        },
        checkoutDate: { $ifNull: ['$lastCheckout.checkoutDate', '$lastCheckout.createdAt'] },
        expectedReturnDate: '$lastCheckout.expectedReturnDate',
        purpose: '$lastCheckout.purpose',
        documentPath: '$lastCheckout.documentPath',
      },
    },
    { $sort: { checkoutDate: 1 } },
  ]);

  return { user, assignedAssets: checkouts };
};

module.exports = { inventoryStatus, assetAging, userAudit };
