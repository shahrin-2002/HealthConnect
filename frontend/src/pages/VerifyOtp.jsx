import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const verifyOtpHandler = async () => {
    try {
      const res = await api.post("/auth/verify-otp", {
        userId: localStorage.getItem("userId"),
        otp,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login successful");
      navigate("/availability");
    } catch {
      alert("Invalid OTP");
    }
  };

  return (
    <div>
      <h2>Verify OTP</h2>
      <input placeholder="Enter OTP" onChange={e => setOtp(e.target.value)} />
      <button onClick={verifyOtpHandler}>Verify</button>
    </div>
  );
}
