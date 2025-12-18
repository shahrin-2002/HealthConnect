const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId);
  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    return res.status(400).json({ msg: "Invalid OTP" });
  }

  user.otp = null;
  user.otpExpires = null;
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({ token, role: user.role });
};
