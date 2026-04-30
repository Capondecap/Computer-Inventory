const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { secret, expiresIn } = require('../config/auth');

// Pre-computed hash used when user not found — keeps response time consistent
// to prevent email enumeration via timing differences.
const DUMMY_HASH = '$2b$12$KIXxb7OlAFN0VlzA1g7VFeFUf4iJn.rkn3nT/gA4aFzYf7DKf5OZi';

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  // Always run bcrypt regardless of whether user exists
  const hashToCompare = user ? user.password : DUMMY_HASH;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Access denied. Contact your administrator.');
    err.status = 403;
    throw err;
  }

  const payload = { sub: user._id, role: user.role };
  const token = jwt.sign(payload, secret, { expiresIn });

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

module.exports = { login };
