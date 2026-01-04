const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Optional localized Bangla name for UI
  name_bn: {
    type: String,
    trim: true,
    default: null
  },
  location: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: String,
  pincode: String,
  phone: String,
  email: String,
  specializations: String,
  description: String,
  beds_total: {
    type: Number,
    default: 0
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Add text index for search
hospitalSchema.index({ name: 'text', city: 'text', specializations: 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
