/**
 * GeneralBed Model
 * Stores general bed availability information for hospitals
 */

const mongoose = require('mongoose');

const generalBedSchema = new mongoose.Schema({
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  total_beds: {
    type: Number,
    required: true,
    default: 0
  },
  available_beds: {
    type: Number,
    required: true,
    default: 0
  },
  booked_beds: {
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

// Index for faster queries
generalBedSchema.index({ hospital_id: 1 });

module.exports = mongoose.model('GeneralBed', generalBedSchema);
