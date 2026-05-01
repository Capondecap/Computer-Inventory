const { validationResult } = require('express-validator');
const ApiKey = require('../models/ApiKey.model');

const createKey = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, userId, expiresAt } = req.body;
    const { raw, hash, preview } = ApiKey.generate();

    const apiKey = await ApiKey.create({
      keyHash: hash,
      keyPreview: preview,
      name,
      user: userId ?? req.user.sub,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Raw key returned once — never stored, never retrievable again
    res.status(201).json({
      success: true,
      message: 'Store this key now. It will not be shown again.',
      key: raw,
      apiKey: {
        id: apiKey._id,
        name: apiKey.name,
        keyPreview: apiKey.keyPreview,
        user: apiKey.user,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const listKeys = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const filter = req.query.userId ? { user: req.query.userId } : {};

    const keys = await ApiKey.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
};

const deactivateKey = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const key = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!key) return res.status(404).json({ success: false, message: 'API key not found' });

    res.json({ success: true, message: 'API key deactivated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createKey, listKeys, deactivateKey };
