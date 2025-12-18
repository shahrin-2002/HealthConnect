const express = require("express");
const { login } = require("../controllers/authController");
const { verifyOtp } = require("../controllers/otpController");

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);

module.exports = router;
