const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { secret } = require('../config/auth');

const authenticate = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.sub).select('isActive').lean();

    if (!user || !user.isActive) {
      res.clearCookie('token');
      return next();
    }

    req.user = decoded;
  } catch {
    res.clearCookie('token');
  }
  next();
};

module.exports = authenticate;
