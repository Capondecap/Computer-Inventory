const ApiKey = require('../models/ApiKey.model');
const User = require('../models/User.model');

const apiKeyAuth = async (req, res, next) => {
  if (req.user) return next(); // already authenticated via JWT cookie

  const raw = req.headers['x-api-key'];
  if (!raw) return next();

  try {
    const keyHash = ApiKey.hashKey(raw);
    const apiKey = await ApiKey.findOne({ keyHash }).lean();

    if (!apiKey || !apiKey.isActive) {
      const err = new Error('Unauthorized');
      err.status = 401;
      return next(err);
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      const err = new Error('Unauthorized');
      err.status = 401;
      return next(err);
    }

    const user = await User.findById(apiKey.user).select('role isActive').lean();

    if (!user || !user.isActive) {
      const err = new Error('Unauthorized');
      err.status = 401;
      return next(err);
    }

    // Non-blocking — don't delay the request for a stats update
    ApiKey.updateOne({ _id: apiKey._id }, { lastUsedAt: new Date() }).exec()
      .catch(err => console.error('[apiKeyAuth] lastUsedAt update failed:', err.message));

    req.user = { sub: user._id, role: user.role };
  } catch {
    const err = new Error('Unauthorized');
    err.status = 401;
    return next(err);
  }

  next();
};

module.exports = apiKeyAuth;
