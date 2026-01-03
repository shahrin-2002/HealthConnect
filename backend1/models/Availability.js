import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
  doctorId: String,
  day: String,
  slots: [String]
});

export default mongoose.model("Availability", availabilitySchema);
