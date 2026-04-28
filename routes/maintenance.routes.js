const express = require('express');
const router = express.Router();
const maintenanceCtrl = require('../controllers/maintenance.controller');

// ── Middleware owned by Person 1 ─────────────────────────────────────────────
const { requireJWT } = require('../middleware/auth.middleware');

// ─── JSON API  (mounted at /api/maintenance in routes/index.js) ──────────────
const api = express.Router();

api.get('/',    requireJWT, maintenanceCtrl.apiListMaintenance);
api.get('/:id', requireJWT, maintenanceCtrl.apiGetMaintenance);
api.post('/',   requireJWT, maintenanceCtrl.apiCreateMaintenance);
api.patch('/:id', requireJWT, maintenanceCtrl.apiUpdateMaintenance);

// ─── UI  (mounted at /maintenance in routes/index.js) ────────────────────────
router.get('/',         requireJWT, maintenanceCtrl.uiListMaintenance);
router.get('/new',      requireJWT, maintenanceCtrl.uiNewMaintenanceForm);
router.post('/',        requireJWT, maintenanceCtrl.uiCreateMaintenance);
router.get('/:id/edit', requireJWT, maintenanceCtrl.uiEditMaintenanceForm);
router.post('/:id',     requireJWT, maintenanceCtrl.uiUpdateMaintenance);

module.exports = { uiRouter: router, apiRouter: api };
