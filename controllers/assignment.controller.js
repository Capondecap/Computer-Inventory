const assignmentService = require('../services/assignment.service');

// ─── API handlers ─────────────────────────────────────────────────────────────
exports.apiCheckout = async (req, res, next) => {
  try {
    const { assetId, assignedToId, notes } = req.body;
    const assignment = await assignmentService.checkoutAsset({
      assetId,
      assignedToId,
      assignedById: req.user._id,
      notes,
      document: req.file,
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

exports.apiCheckin = async (req, res, next) => {
  try {
    const { assetId, notes } = req.body;
    const assignment = await assignmentService.checkinAsset({
      assetId,
      returnedById: req.user._id,
      notes,
      document: req.file,
    });
    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

exports.apiListAssignments = async (req, res, next) => {
  try {
    const result = await assignmentService.listAssignments(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.apiGetAssignment = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getAssignmentById(req.params.id);
    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
};

// ─── UI (HBS) handlers ────────────────────────────────────────────────────────
exports.uiListAssignments = async (req, res, next) => {
  try {
    const result = await assignmentService.listAssignments({ ...req.query, limit: 15 });
    res.render('assignments/index', {
      title: 'Assignments',
      ...result,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

exports.uiCheckoutForm = (req, res) => {
  res.render('assignments/form', { title: 'Check Out Asset', action: 'checkout', assetId: req.query.assetId });
};

exports.uiCheckinForm = (req, res) => {
  res.render('assignments/form', { title: 'Check In Asset', action: 'checkin', assetId: req.query.assetId });
};

exports.uiCheckout = async (req, res, next) => {
  try {
    const { assetId, assignedToId, notes } = req.body;
    await assignmentService.checkoutAsset({
      assetId,
      assignedToId,
      assignedById: req.user._id,
      notes,
      document: req.file,
    });
    req.flash('success', 'Asset checked out successfully.');
    res.redirect(`/assets/${assetId}`);
  } catch (err) {
    if (err.statusCode === 400) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    next(err);
  }
};

exports.uiCheckin = async (req, res, next) => {
  try {
    const { assetId, notes } = req.body;
    await assignmentService.checkinAsset({
      assetId,
      returnedById: req.user._id,
      notes,
      document: req.file,
    });
    req.flash('success', 'Asset checked in successfully.');
    res.redirect(`/assets/${assetId}`);
  } catch (err) {
    if (err.statusCode === 400) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    next(err);
  }
};
