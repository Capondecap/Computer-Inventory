const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // matches default JWT_EXPIRES_IN of 8h

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE_MS,
    });

    res.json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };
