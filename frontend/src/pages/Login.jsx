import { useState } from "react";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState("");
  const [otp, setOtp] = useState("");

  const login = async () => {
    const res = await api.post("/auth/login", { email, password });
    setUserId(res.data.userId);
    alert("OTP Sent");
  };

  const verifyOtp = async () => {
    const res = await api.post("/auth/verify-otp", { userId, otp });
    localStorage.setItem("token", res.data.token);
    alert("Login Success");
  };

  return (
    <>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password"
             onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Login</button>

      <input placeholder="OTP" onChange={e => setOtp(e.target.value)} />
      <button onClick={verifyOtp}>Verify OTP</button>
    </>
  );
}
