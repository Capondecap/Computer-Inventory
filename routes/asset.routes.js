const express = require('express');
const router = express.Router();

const assetController = require('../controllers/asset.controller');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

router.get('/', requireAuth, assetController.getAll);
router.get('/:id/history', requireAuth, assetController.getHistory);
router.post('/', requireAuth, assetController.create);
router.put('/:id', requireAuth, assetController.update);
router.delete('/:id', requireAuth, requireRole('Admin'), assetController.remove);

module.exports = router;
