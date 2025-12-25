const mongoose = require('mongoose');

const icuBookingSchema = new mongoose.Schema({
  icu_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ICU',
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
    required: true
  },
  check_in_date: {
    type: Date,
    required: true
  },
  check_out_date: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['booked', 'checked_in', 'checked_out', 'cancelled'],
    default: 'booked'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
icuBookingSchema.index({ hospital_id: 1, status: 1 });
icuBookingSchema.index({ patient_id: 1 });

module.exports = mongoose.model('ICUBooking', icuBookingSchema);
