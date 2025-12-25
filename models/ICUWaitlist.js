const mongoose = require('mongoose');

const icuWaitlistSchema = new mongoose.Schema({
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  patient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  patient_name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  requested_date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'booked', 'expired'],
    default: 'waiting'
  },
  position: {
    type: Number,
    required: true
  },
  notified_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for FCFS ordering
icuWaitlistSchema.index({ hospital_id: 1, status: 1, position: 1 });
icuWaitlistSchema.index({ email: 1, hospital_id: 1 });

module.exports = mongoose.model('ICUWaitlist', icuWaitlistSchema);
