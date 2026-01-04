import { useState } from "react";
import { api } from "../api";

export default function OTPLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  const sendOTP = async () => {
    await api("/api/auth/send", "POST", { email });
    setMsg("📩 OTP sent to email");
  };

  const verifyOTP = async () => {
    await api("/api/auth/verify", "POST", { email, otp });
    setMsg("✅ Login successful");
  };

  return (
    <div style={card}>
      <h3>🔐 Two-Factor Login</h3>

      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <br /><br />
      <button style={btn} onClick={sendOTP}>Send OTP</button>

      <br /><br />
      <input placeholder="Enter OTP" value={otp} onChange={e => setOtp(e.target.value)} />
      <br /><br />
      <button style={btn} onClick={verifyOTP}>Verify</button>

      <p>{msg}</p>
    </div>
  );
}

const card = { padding: 20, border: "1px solid #ddd", borderRadius: 10 };
const btn = { padding: "8px 14px", background: "#2a9d8f", color: "#fff", border: 0, borderRadius: 6 };
