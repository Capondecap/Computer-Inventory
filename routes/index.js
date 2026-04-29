const express = require('express');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/auth/login'));

router.get('/auth/login', (req, res) =>
  res.render('auth/login', { layout: 'auth', pageTitle: 'Login' })
);

module.exports = router;
