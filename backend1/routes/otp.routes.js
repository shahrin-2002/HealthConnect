import express from "express";
import Otp from "../models/Otp.js";
import { sendOtp } from "../utils/sendOtp.js";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await Otp.create({
    email,
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000)
  });

  await sendOtp(email, otp);
  res.json({ message: "OTP sent" });
});

export default router;
