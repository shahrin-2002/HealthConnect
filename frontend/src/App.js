import { useState } from "react";
import { api } from "./api";

export default function App() {
  // OTP
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");

  // Doctor
  const [slot, setSlot] = useState("");
  const [slotMsg, setSlotMsg] = useState("");

  // Ambulance
  const [eta, setEta] = useState(null);

  async function sendOTP() {
    try {
      await api("/api/auth/send-otp", "POST", { contact });
      setMsg("OTP sent");
    } catch (e) {
      setMsg(e.message);
    }
  }

  async function verifyOTP() {
    try {
      await api("/api/auth/verify-otp", "POST", { contact, otp });
      setMsg("Login successful");
    } catch {
      setMsg("Invalid OTP");
    }
  }

  async function bookSlot() {
    try {
      await api("/api/doctor/book", "POST", { datetime: slot });
      setSlotMsg("Slot booked");
    } catch (e) {
      setSlotMsg(e.message);
    }
  }

  async function bookAmbulance() {
    const res = await api("/api/ambulance/book", "POST");
    setEta(res.eta);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>HealthConnect – Member 2</h1>

      <h2>Two-Factor Login (OTP)</h2>
      <input placeholder="Email or Phone" onChange={e => setContact(e.target.value)} />
      <button onClick={sendOTP}>Send OTP</button>
      <br />
      <input placeholder="Enter OTP" onChange={e => setOtp(e.target.value)} />
      <button onClick={verifyOTP}>Verify</button>
      <p>{msg}</p>

      <h2>Doctor Availability</h2>
      <input type="datetime-local" onChange={e => setSlot(e.target.value)} />
      <button onClick={bookSlot}>Book Slot</button>
      <p>{slotMsg}</p>

      <h2>E-Prescriptions</h2>
      <button onClick={() => window.open("http://127.0.0.1:9358/api/prescriptions/qr")}>
        Generate QR
      </button>
      <button onClick={() => window.open("http://127.0.0.1:9358/api/prescriptions/pdf")}>
        Download PDF
      </button>

      <h2>Ambulance Booking</h2>
      <button onClick={bookAmbulance}>Book Ambulance</button>
      {eta && <p>Live ETA: {eta} minutes</p>}
    </div>
  );
}
