const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requesting user is required'],
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    type: {
      type: String,
      enum: ['Repair', 'Upgrade', 'Inspection', 'Cleaning', 'Other'],
      required: [true, 'Maintenance type is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'In-Progress', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    resolution: {
      type: String,
      trim: true,
      default: null,
    },
    scheduledDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    cost: {
      type: Number,
      min: 0,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

maintenanceSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

maintenanceSchema.index({ asset: 1, status: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
