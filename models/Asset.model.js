const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: [true, 'Item ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    serialNumber: {
      type: String,
      required: [true, 'Serial number is required'],
      unique: true,
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Laptop', 'Desktop', 'Server', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Other'],
        message: '{VALUE} is not a valid category',
      },
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['Computer', 'Peripheral'],
        message: '{VALUE} is not a valid type',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'In-Use', 'Maintenance', 'Retired'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Available',
    },
    dateAcquired: {
      type: Date,
      required: [true, 'Date acquired is required'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: age in years
assetSchema.virtual('ageInYears').get(function () {
  const now = new Date();
  const acquired = new Date(this.dateAcquired);
  return ((now - acquired) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
});

// Virtual: is aging (older than 3 years)
assetSchema.virtual('isAging').get(function () {
  return parseFloat(this.ageInYears) > 3;
});

// Soft-delete filter: exclude deleted by default
assetSchema.pre(/^find/, function (next) {
  if (!this.getOptions().withDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

assetSchema.set('toJSON', { virtuals: true });
assetSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Asset', assetSchema);
