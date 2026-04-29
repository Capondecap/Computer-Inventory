const express = require('express');
const { body } = require('express-validator');
const { login } = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('A valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1, max: 128 })
    .withMessage('Password exceeds allowed length'),
];

router.post('/login', loginLimiter, loginValidation, login);

module.exports = router;
