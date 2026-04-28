const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
      index: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Performing user is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'asset_created',
        'asset_updated',
        'asset_deleted',
        'asset_restored',
        'status_changed',
        'checked_out',
        'checked_in',
        'maintenance_requested',
        'maintenance_updated',
        'maintenance_completed',
      ],
    },
    // short description of what happened
    description: {
      type: String,
      trim: true,
    },
    // what changed: { field: { from, to } }
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // link to related record if any
    relatedModel: {
      type: String,
      enum: ['Assignment', 'Maintenance', null],
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

auditLogSchema.index({ asset: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

// audit logs can't be edited
auditLogSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
  throw new Error('AuditLog records are immutable');
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
