// src/components/OTPLogin.js
import React, { useState } from "react";
import { api } from "../api";

export default function OTPLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  async function sendOtp() {
    try {
      await api("/api/auth/send", "POST", { email });
      setMsg("OTP sent to your email");
    } catch (e) {
      setMsg("Error sending OTP: " + e.message);
    }
  }

  async function verifyOtp() {
    // Backend verify route missing — for now mock success
    setMsg("OTP verification not implemented in backend yet");
  }

  return (
    <div>
      <h2>Two-Factor Login (OTP)</h2>
      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "250px", padding: 6, marginBottom: 8 }}
      />
      <button onClick={sendOtp}>Send OTP</button>
      <br />
      <input
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        style={{ width: "250px", padding: 6, marginTop: 8, marginBottom: 8 }}
      />
      <button onClick={verifyOtp}>Verify OTP</button>
      <p>{msg}</p>
    </div>
  );
}
