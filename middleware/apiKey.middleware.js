const ApiKey = require('../models/ApiKey.model');
const User = require('../models/User.model');

const authenticateApiKey = async (req, res, next) => {
  const raw = req.headers['x-api-key'];

  if (!raw) {
    return res.status(401).json({ success: false, message: 'API key required' });
  }

  const hash = ApiKey.hashKey(raw);
  const apiKey = await ApiKey.findOne({ keyHash: hash }).select('+keyHash').populate('user');

  if (!apiKey || !apiKey.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid or inactive API key' });
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return res.status(401).json({ success: false, message: 'API key has expired' });
  }

  if (!apiKey.user || !apiKey.user.isActive) {
    return res.status(401).json({ success: false, message: 'Key owner not found or inactive' });
  }

  // update lastUsedAt without triggering full validation
  ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).exec();

  req.user = apiKey.user;
  next();
};

module.exports = { authenticateApiKey };
