const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateOtp = require("../utils/generateOtp");
const sendEmailOtp = require("../utils/sendEmailOtp");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ msg: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ msg: "Invalid password" });

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = Date.now() + 5 * 60 * 1000;
  await user.save();

  await sendEmailOtp(email, otp);
  res.json({ userId: user._id, msg: "OTP sent" });
};
