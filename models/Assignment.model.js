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
    checkoutDate: {
      type: Date,
      default: Date.now,
    },
    checkinDate: {
      type: Date,
      default: null,
    },
    checkoutDocument: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
    },
    checkinDocument: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
    },
    status: {
      type: String,
      enum: ['Active', 'Returned'],
      default: 'Active',
    },
    checkoutNotes: {
      type: String,
      trim: true,
    },
    checkinNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: duration of assignment in days
assignmentSchema.virtual('durationDays').get(function () {
  const end = this.checkinDate || new Date();
  const start = this.checkoutDate;
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

assignmentSchema.set('toJSON', { virtuals: true });
assignmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
