const express = require('express');
const router = express.Router();

const assetController = require('../controllers/asset.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authenticateApiKey } = require('../middleware/apiKey.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

// allow JWT or API key for read access
const flexAuth = (req, res, next) => {
  if (req.headers['x-api-key']) return authenticateApiKey(req, res, next);
  return authenticate(req, res, next);
};

router.get('/', flexAuth, assetController.getAll);
router.get('/:id/history', authenticate, assetController.getHistory);
router.post('/', authenticate, assetController.create);
router.put('/:id', authenticate, assetController.update);
router.delete('/:id', authenticate, requireRole('Admin'), assetController.remove);

module.exports = router;
