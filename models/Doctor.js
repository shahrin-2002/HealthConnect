const mongoose = require('mongoose');

// Sub-schema for weekly availability
const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: { type: String, required: true }, // Format "09:00"
  endTime: { type: String, required: true },   // Format "17:00"
  isAvailable: { type: Boolean, default: true }
});

const doctorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hospital_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  license_number: {
    type: String,
    unique: true,
    sparse: true
  },
  experience_years: {
    type: Number,
    default: 0
  },
  qualifications: String,
  consultation_fee: {
    type: Number,
    default: 500
  },
  availability_status: {
    type: String,
    enum: ['Available', 'Busy', 'On_Leave'],
    default: 'Available'
  },
  phone: String,
  email: String,


  slotDuration: { type: Number, default: 30 }, // Duration in minutes
  availability: [availabilitySchema]
}, {
  timestamps: true
});

// Add index for search
doctorSchema.index({ name: 'text', specialization: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
