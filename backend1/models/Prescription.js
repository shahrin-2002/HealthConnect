import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema({
  patientName: String,
  doctorName: String,
  medicines: [String],
  qrCode: String
});

export default mongoose.model("Prescription", prescriptionSchema);
