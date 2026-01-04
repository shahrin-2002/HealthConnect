const mongoose = require('mongoose');

const icuSchema = new mongoose.Schema({
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  total_icu: {
    type: Number,
    required: true,
    default: 0
  },
  available_icu: {
    type: Number,
    required: true,
    default: 0
  },
  booked_icu: {
    type: Number,
    default: 0
  },
  price_per_day: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure one ICU record per hospital
icuSchema.index({ hospital_id: 1 }, { unique: true });

module.exports = mongoose.model('ICU', icuSchema);
