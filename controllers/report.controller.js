const reportService = require('../services/report.service');

const getInventoryStatus = async (req, res, next) => {
  try {
    const data = await reportService.inventoryStatus();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAssetAging = async (req, res, next) => {
  try {
    const years = req.query.years ? parseInt(req.query.years) : 3;
    if (isNaN(years) || years < 1) {
      return res.status(400).json({ success: false, message: 'years must be a positive number' });
    }
    const data = await reportService.assetAging(years);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
};

const getUserAudit = async (req, res, next) => {
  try {
    const result = await reportService.userAudit(req.params.userId);
    if (!result) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventoryStatus, getAssetAging, getUserAudit };
