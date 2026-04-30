const express = require('express');
const { body, param, query } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { createKey, listKeys, deactivateKey } = require('../controllers/apiKey.controller');

const router = express.Router();

const adminOnly = [requireAuth, requireRole('Admin')];

router.post(
  '/',
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Key name is required'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO 8601 date'),
  ],
  createKey
);

router.get(
  '/',
  adminOnly,
  [
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
  ],
  listKeys
);

router.delete(
  '/:id',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid API key ID'),
  ],
  deactivateKey
);

module.exports = router;
