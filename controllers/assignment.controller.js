const assignmentSvc = require('../services/assignment.service');

const checkout = async (req, res, next) => {
  try {
    const { assetId, assignedTo, expectedReturnDate, purpose, condition, notes } = req.body;

    if (!assetId || !assignedTo) {
      return res.status(400).json({ success: false, message: 'assetId and assignedTo are required' });
    }

    const assignment = await assignmentSvc.checkout({
      assetId,
      assignedTo,
      assignedBy: req.user.sub,
      expectedReturnDate: expectedReturnDate || null,
      purpose,
      condition,
      notes,
      documentPath: req.file ? req.file.path : null,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

const checkin = async (req, res, next) => {
  try {
    const { assetId, condition, notes } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'assetId is required' });
    }

    const assignment = await assignmentSvc.checkin({
      assetId,
      performedBy: req.user.sub,
      condition,
      notes,
      documentPath: req.file ? req.file.path : null,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkout, checkin };
