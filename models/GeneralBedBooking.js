/**
 * GeneralBedBooking Model
 * Stores general bed booking records
 */

const mongoose = require('mongoose');

const generalBedBookingSchema = new mongoose.Schema({
  bed_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneralBed',
    required: true
  },
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient_name: {
    type: String,
    required: true
  },
  patient_phone: {
    type: String,
    required: true
  },
  booking_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  check_in_date: {
    type: Date,
    required: true
  },
  check_out_date: {
    type: Date
  },
  status: {
    type: String,
    enum: ['booked', 'checked_in', 'checked_out', 'cancelled'],
    default: 'booked'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
generalBedBookingSchema.index({ hospital_id: 1, status: 1 });
generalBedBookingSchema.index({ patient_id: 1 });

module.exports = mongoose.model('GeneralBedBooking', generalBedBookingSchema);
