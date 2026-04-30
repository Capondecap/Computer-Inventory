const assetService = require('../services/asset.service');

const getAll = async (req, res, next) => {
  try {
    const { assets, meta } = await assetService.listAssets(req.query);
    res.json({ success: true, data: assets, meta });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body);
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    // duplicate key (itemId or serialNumber)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      err.status = 409;
      err.message = `${field} already exists`;
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: asset });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      err.status = 409;
      err.message = `${field} already exists`;
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const asset = await assetService.softDeleteAsset(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, message: 'Asset deleted' });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await assetService.getAssetHistory(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove, getHistory };
