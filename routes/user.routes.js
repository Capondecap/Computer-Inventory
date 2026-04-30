const express = require('express');
const { body, param } = require('express-validator');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const { createUser, getUser, updateUser, updateRole, updateStatus, searchUsers } = require('../controllers/user.controller');

const router = express.Router();

const VALID_ROLES = ['Admin', 'Technician'];
const adminOnly = [requireAuth, requireRole('Admin')];

router.post(
  '/',
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  ],
  createUser
);

router.patch(
  '/:id/role',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('role').isIn(VALID_ROLES).withMessage(`Role must be one of: ${VALID_ROLES.join(', ')}`),
  ],
  updateRole
);

router.patch(
  '/:id/status',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  updateStatus
);

router.get('/search', requireAuth, searchUsers);

router.get(
  '/:id',
  adminOnly,
  [param('id').isMongoId().withMessage('Invalid user ID')],
  getUser
);

router.put(
  '/:id',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .optional({ checkFalsy: true })
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  updateUser
);

module.exports = router;
