import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  isVerified: { type: Boolean, default: false }
});

export default mongoose.model("User", userSchema);
