/**
 * CabinBooking Model
 * Stores cabin booking records
 */

const mongoose = require('mongoose');

const cabinBookingSchema = new mongoose.Schema({
  cabin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cabin',
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
cabinBookingSchema.index({ hospital_id: 1, status: 1 });
cabinBookingSchema.index({ patient_id: 1 });

module.exports = mongoose.model('CabinBooking', cabinBookingSchema);
