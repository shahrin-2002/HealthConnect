import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config(); // Load .env first

const app = express();

// Connect to MongoDB
connectDB();

app.use(express.json());

// Example routes (update with your actual routes)
app.use("/api/auth", import("./routes/otp.routes.js"));
app.use("/api/prescriptions", import("./routes/prescription.routes.js"));

const PORT = process.env.PORT || 9358;
app.listen(PORT, () => {
  console.log(`🏥 Healthcare API Server running on http://127.0.0.1:${PORT}`);
});
