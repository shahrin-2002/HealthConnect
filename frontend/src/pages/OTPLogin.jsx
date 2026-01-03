import axios from "../api/axios";

export default function OTPLogin() {
  const sendOtp = () => axios.post("/otp/send", { email });
  const verifyOtp = () => axios.post("/otp/verify", { email, otp });

  return (
    <>
      <input placeholder="Email" />
      <button onClick={sendOtp}>Send OTP</button>
      <input placeholder="OTP" />
      <button onClick={verifyOtp}>Verify</button>
    </>
  );
}
