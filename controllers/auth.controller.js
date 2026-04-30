const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');

const COOKIE_MAX_AGE_MS = 8 * 60 * 60 * 1000; // matches default JWT_EXPIRES_IN of 8h

const login = async (req, res, next) => {
  const isForm = req.is('urlencoded');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    if (isForm) {
      return res.status(422).render('auth/login', {
        layout: 'auth',
        pageTitle: 'Login',
        error: errors.array()[0].msg,
        formData: { email: req.body.email },
      });
    }
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

    if (isForm) return res.redirect('/dashboard');
    res.json({ success: true, user, token });
  } catch (err) {
    if (isForm && err.status < 500) {
      return res.status(err.status).render('auth/login', {
        layout: 'auth',
        pageTitle: 'Login',
        error: err.message,
        formData: { email: req.body.email },
      });
    }
    next(err);
  }
};

module.exports = { login };
