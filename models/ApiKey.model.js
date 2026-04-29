const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema(
  {
    // only store the hash, not the actual key
    keyHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    // last 4 chars of the key, shown in the UI
    keyPreview: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Key name / label is required'],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner user is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

apiKeySchema.index({ user: 1 });

// returns { raw, hash, preview } — show raw once, save only the hash
apiKeySchema.statics.generate = function () {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const preview = raw.slice(-4);
  return { raw, hash, preview };
};

apiKeySchema.statics.hashKey = function (raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
