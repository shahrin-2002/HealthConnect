import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import otpRoutes from "./routes/otp.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import prescriptionRoutes from "./routes/prescription.routes.js";
import ambulanceRoutes from "./routes/ambulance.routes.js";

dotenv.config();

// Connect to database (make sure this returns a promise and handle errors accordingly)
connectDB()
  .then(() => console.log("Database connected"))
  .catch((err) => {
    console.error("Database connection failed:", err);
    process.exit(1); // Exit process if DB connection fails
  });

const app = express();

// Enable CORS for frontend origin
app.use(
  cors({
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200, // some legacy browsers choke on 204
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// Routes
app.use("/api/auth", otpRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/ambulance", ambulanceRoutes);

// Optional health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: Date.now() });
});

// Global error handler (optional, improves error responses)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 9358;
app.listen(PORT, () => {
  console.log(`🏥 Server running on http://localhost:${PORT}`);
});
