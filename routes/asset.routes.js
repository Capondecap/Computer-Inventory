const express = require('express');
const router = express.Router();
const assetCtrl = require('../controllers/asset.controller');

// ── Middleware owned by Person 1 ─────────────────────────────────────────────
const { requireJWT, requireJWTOrApiKey } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

// ─── JSON API  (mounted at /api/items in routes/index.js) ────────────────────
const api = express.Router();

api.get('/',              requireJWTOrApiKey, assetCtrl.apiListAssets);
api.get('/:id',           requireJWT,         assetCtrl.apiGetAsset);
api.get('/:id/history',   requireJWT,         assetCtrl.apiGetHistory);
api.post('/',             requireJWT,         assetCtrl.apiCreateAsset);
api.put('/:id',           requireJWT,         assetCtrl.apiUpdateAsset);
api.delete('/:id',        requireJWT, requireAdmin, assetCtrl.apiDeleteAsset);

// ─── UI  (mounted at /assets in routes/index.js) ─────────────────────────────
router.get('/',            requireJWT, assetCtrl.uiListAssets);
router.get('/new',         requireJWT, assetCtrl.uiNewAssetForm);
router.post('/',           requireJWT, assetCtrl.uiCreateAsset);
router.get('/:id',         requireJWT, assetCtrl.uiGetAsset);
router.get('/:id/edit',    requireJWT, assetCtrl.uiEditAssetForm);
router.post('/:id',        requireJWT, assetCtrl.uiUpdateAsset);
router.post('/:id/delete', requireJWT, requireAdmin, assetCtrl.uiDeleteAsset);

module.exports = { uiRouter: router, apiRouter: api };
