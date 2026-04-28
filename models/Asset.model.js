const mongoose = require('mongoose');

const COMPUTER_TYPES = ['Laptop', 'Desktop', 'Server'];
const PERIPHERAL_TYPES = ['Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner', 'UPS', 'Other'];
const ALL_CATEGORIES = [...COMPUTER_TYPES, ...PERIPHERAL_TYPES];

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
      enum: ALL_CATEGORIES,
    },
    classification: {
      type: String,
      enum: ['Computer', 'Peripheral'],
    },
    status: {
      type: String,
      enum: ['Available', 'In-Use', 'Maintenance', 'Retired'],
      default: 'Available',
    },
    dateAcquired: {
      type: Date,
      required: [true, 'Date acquired is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// set classification based on category
assetSchema.pre('save', function (next) {
  this.classification = COMPUTER_TYPES.includes(this.category) ? 'Computer' : 'Peripheral';
  next();
});

// hide deleted assets from all queries
assetSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: false });
  }
  next();
});

assetSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

assetSchema.statics.COMPUTER_TYPES = COMPUTER_TYPES;
assetSchema.statics.PERIPHERAL_TYPES = PERIPHERAL_TYPES;

module.exports = mongoose.model('Asset', assetSchema);
