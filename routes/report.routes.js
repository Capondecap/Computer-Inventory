const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const requireAuth = require('../middleware/requireAuth');

router.get('/inventory-status', requireAuth, reportController.getInventoryStatus);
router.get('/asset-aging', requireAuth, reportController.getAssetAging);
router.get('/user-audit/:userId', requireAuth, reportController.getUserAudit);

module.exports = router;
