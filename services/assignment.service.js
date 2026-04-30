const mongoose = require('mongoose');
const Asset = require('../models/Asset.model');
const Assignment = require('../models/Assignment.model');
const auditSvc = require('./audit.service');

const BLOCKED_STATUSES = ['Maintenance', 'Retired'];

const checkout = async ({ assetId, assignedTo, assignedBy, expectedReturnDate, purpose, condition, notes, documentPath, ipAddress }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const asset = await Asset.findById(assetId).session(session);

    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { status: 404 });
    }

    if (BLOCKED_STATUSES.includes(asset.status)) {
      throw Object.assign(
        new Error(`Cannot check out an asset with status "${asset.status}"`),
        { status: 422 }
      );
    }

    if (asset.status === 'In-Use') {
      throw Object.assign(new Error('Asset is already checked out'), { status: 422 });
    }

    const [assignment] = await Assignment.create(
      [{
        asset: asset._id,
        assignedTo,
        assignedBy,
        eventType: 'checkout',
        checkoutDate: new Date(),
        expectedReturnDate: expectedReturnDate || null,
        purpose: purpose || null,
        condition: condition || 'Good',
        notes: notes || null,
        documentPath: documentPath || null,
      }],
      { session }
    );

    const prevStatus = asset.status;
    asset.status = 'In-Use';
    await asset.save({ session });

    await auditSvc.log({
      asset: asset._id,
      performedBy: assignedBy,
      action: 'checked_out',
      description: `Checked out to user ${assignedTo}`,
      changes: { status: { from: prevStatus, to: 'In-Use' } },
      relatedModel: 'Assignment',
      relatedId: assignment._id,
      ipAddress,
      session,
    });

    await session.commitTransaction();
    return assignment;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const checkin = async ({ assetId, performedBy, condition, notes, documentPath, ipAddress }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const asset = await Asset.findById(assetId).session(session);

    if (!asset) {
      throw Object.assign(new Error('Asset not found'), { status: 404 });
    }

    if (asset.status !== 'In-Use') {
      throw Object.assign(
        new Error(`Asset is not currently checked out (status: "${asset.status}")`),
        { status: 422 }
      );
    }

    // find who last checked it out so we can link the checkin record back to them
    const lastCheckout = await Assignment.findOne({ asset: assetId, eventType: 'checkout' })
      .sort({ createdAt: -1 })
      .session(session);

    const [assignment] = await Assignment.create(
      [{
        asset: asset._id,
        assignedTo: lastCheckout ? lastCheckout.assignedTo : performedBy,
        assignedBy: performedBy,
        eventType: 'checkin',
        checkinDate: new Date(),
        condition: condition || 'Good',
        notes: notes || null,
        documentPath: documentPath || null,
      }],
      { session }
    );

    const prevStatus = asset.status;
    asset.status = 'Available';
    await asset.save({ session });

    await auditSvc.log({
      asset: asset._id,
      performedBy,
      action: 'checked_in',
      description: 'Asset returned and marked available',
      changes: { status: { from: prevStatus, to: 'Available' } },
      relatedModel: 'Assignment',
      relatedId: assignment._id,
      ipAddress,
      session,
    });

    await session.commitTransaction();
    return assignment;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { checkout, checkin };
