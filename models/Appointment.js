const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['booked', 'approved', 'cancelled', 'rescheduled', 'waitlisted', 'completed'],
    default: 'booked'
  },
  // Appointment type: online (video call) or in-person
  type: {
    type: String,
    enum: ['online', 'in-person'],
    default: 'in-person'
  },
  notes: { type: String },
  promotedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
