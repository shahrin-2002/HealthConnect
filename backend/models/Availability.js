const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  date: String,
  slots: [
    {
      time: String,
      isBooked: { type: Boolean, default: false },
    },
  ],
});

module.exports = mongoose.model("Availability", availabilitySchema);
