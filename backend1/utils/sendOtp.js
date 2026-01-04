import nodemailer from "nodemailer";

export const sendOtp = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "yourgmail@gmail.com",
      pass: "your-app-password"
    }
  });

  await transporter.sendMail({
    from: "HealthConnect",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}`
  });
};
