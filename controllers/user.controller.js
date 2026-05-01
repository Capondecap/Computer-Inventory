const { validationResult } = require('express-validator');
const User = require('../models/User.model');
const ApiKey = require('../models/ApiKey.model');

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role: role ?? 'Technician' });

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isActive && String(req.user.sub) === id) {
      return res.status(403).json({ success: false, message: 'Cannot disable your own account' });
    }

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!isActive) {
      await ApiKey.updateMany({ user: id }, { isActive: false });
    }

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, password } = req.body;
    user.name = name;
    user.email = email;

    if (typeof password === 'string' && password.trim()) {
      user.password = password;
    }

    await user.save();

    const updated = await User.findById(user._id).select('-password').lean();
    res.json({ success: true, user: updated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 5000);
    const rx = new RegExp(q, 'i');
    const users = await User.find({
      $and: [
        { $or: [{ isActive: true }, { isActive: { $exists: false } }] },
        { $or: [{ name: rx }, { email: rx }] },
      ],
    }).select('name email role').limit(limit).lean();
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

module.exports = { createUser, getUser, updateUser, updateRole, updateStatus, searchUsers };
