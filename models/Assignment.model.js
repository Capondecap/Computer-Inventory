const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigned user is required'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigning user is required'],
    },
    // checkout = taken out, checkin = returned
    eventType: {
      type: String,
      enum: ['checkout', 'checkin'],
      required: true,
    },
    checkoutDate: {
      type: Date,
      default: null,
    },
    checkinDate: {
      type: Date,
      default: null,
    },
    expectedReturnDate: {
      type: Date,
      default: null,
    },
    purpose: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor'],
      default: 'Good',
    },
    documentPath: {
      type: String,
      trim: true,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ asset: 1, createdAt: -1 });
assignmentSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
