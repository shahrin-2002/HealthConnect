/**
 * Cabin Model
 * Stores cabin availability information for hospitals
 */

const mongoose = require('mongoose');

const cabinSchema = new mongoose.Schema({
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  total_cabins: {
    type: Number,
    required: true,
    default: 0
  },
  available_cabins: {
    type: Number,
    required: true,
    default: 0
  },
  booked_cabins: {
    type: Number,
    default: 0
  },
  price_per_day: {
    type: Number,
    required: true,
    default: 0
  },
  cabin_type: {
    type: String,
    enum: ['standard', 'deluxe', 'vip'],
    default: 'standard'
  }
}, {
  timestamps: true
});

// Index for faster queries
cabinSchema.index({ hospital_id: 1 });

module.exports = mongoose.model('Cabin', cabinSchema);
