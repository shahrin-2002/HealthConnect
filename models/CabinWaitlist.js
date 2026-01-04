/**
 * CabinWaitlist Model
 * Stores waitlist entries for cabins (FCFS)
 */

const mongoose = require('mongoose');

const cabinWaitlistSchema = new mongoose.Schema({
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    required: true
  },
  patient_name: {
    type: String
  },
  phone: {
    type: String
  },
  position: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'booked', 'expired'],
    default: 'waiting'
  },
  notified_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
cabinWaitlistSchema.index({ hospital_id: 1, status: 1, position: 1 });

module.exports = mongoose.model('CabinWaitlist', cabinWaitlistSchema);
