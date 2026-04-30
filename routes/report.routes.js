const express = require('express');
const router = express.Router();

const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/inventory-status', authenticate, reportController.getInventoryStatus);
router.get('/asset-aging', authenticate, reportController.getAssetAging);
router.get('/user-audit/:userId', authenticate, reportController.getUserAudit);

module.exports = router;
