import mongoose from "mongoose";

const ambulanceSchema = new mongoose.Schema({
  patientName: String,
  pickupLocation: String,
  status: { type: String, default: "pending" }
}, { timestamps: true });

export default mongoose.model("AmbulanceBooking", ambulanceSchema);
