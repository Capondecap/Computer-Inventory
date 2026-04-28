const assetService = require('../services/asset.service');

// ─── API handlers ─────────────────────────────────────────────────────────────
exports.apiListAssets = async (req, res, next) => {
  try {
    const result = await assetService.listAssets(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.apiGetAsset = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
};

exports.apiGetHistory = async (req, res, next) => {
  try {
    const result = await assetService.getAssetHistory(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.apiCreateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.createAsset(req.body, req.user._id);
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
};

exports.apiUpdateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user._id);
    res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
};

exports.apiDeleteAsset = async (req, res, next) => {
  try {
    const asset = await assetService.deleteAsset(req.params.id, req.user._id);
    res.json({ success: true, message: `Asset ${asset.itemId} has been retired.` });
  } catch (err) {
    next(err);
  }
};

// ─── UI (HBS) handlers ────────────────────────────────────────────────────────
exports.uiListAssets = async (req, res, next) => {
  try {
    const result = await assetService.listAssets({ ...req.query, limit: 15 });
    res.render('assets/index', {
      title: 'Inventory',
      ...result,
      query: req.query,
      isAdmin: req.user.role === 'Admin',
    });
  } catch (err) {
    next(err);
  }
};

exports.uiNewAssetForm = (req, res) => {
  res.render('assets/form', { title: 'Add Asset', asset: null });
};

exports.uiGetAsset = async (req, res, next) => {
  try {
    const { asset, history } = await assetService.getAssetHistory(req.params.id);
    res.render('assets/detail', {
      title: `${asset.brand} ${asset.model}`,
      asset,
      history,
      isAdmin: req.user.role === 'Admin',
    });
  } catch (err) {
    next(err);
  }
};

exports.uiEditAssetForm = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    res.render('assets/form', { title: 'Edit Asset', asset });
  } catch (err) {
    next(err);
  }
};

exports.uiCreateAsset = async (req, res, next) => {
  try {
    await assetService.createAsset(req.body, req.user._id);
    req.flash('success', 'Asset created successfully.');
    res.redirect('/assets');
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.render('assets/form', {
        title: 'Add Asset',
        asset: req.body,
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }
    next(err);
  }
};

exports.uiUpdateAsset = async (req, res, next) => {
  try {
    await assetService.updateAsset(req.params.id, req.body, req.user._id);
    req.flash('success', 'Asset updated successfully.');
    res.redirect(`/assets/${req.params.id}`);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.render('assets/form', {
        title: 'Edit Asset',
        asset: { ...req.body, _id: req.params.id },
        errors: Object.values(err.errors).map((e) => e.message),
      });
    }
    next(err);
  }
};

exports.uiDeleteAsset = async (req, res, next) => {
  try {
    const asset = await assetService.deleteAsset(req.params.id, req.user._id);
    req.flash('success', `Asset ${asset.itemId} has been retired.`);
    res.redirect('/assets');
  } catch (err) {
    next(err);
  }
};
