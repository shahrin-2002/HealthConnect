import { useState } from "react";
import { api } from "./api";

const btn = {
  padding: "10px 20px",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "16px",
  transition: "background-color 0.3s",
};
const btnSecondary = {
  ...btn,
  backgroundColor: "#28a745",
  marginLeft: 10,
};
const inputStyle = {
  padding: "10px",
  fontSize: "16px",
  borderRadius: "5px",
  border: "1px solid #ccc",
  marginBottom: 10,
  width: "100%",
  boxSizing: "border-box",
};
const sectionStyle = {
  marginBottom: 40,
  maxWidth: 400,
  backgroundColor: "#f9f9f9",
  padding: 20,
  borderRadius: 8,
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};
const containerStyle = {
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  backgroundColor: "#e9ecef",
  minHeight: "100vh",
  padding: "40px 20px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

export default function App() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState("");
  const [slot, setSlot] = useState("");
  const [eta, setEta] = useState(null);

  async function sendOTP() {
    await api("/api/auth/send", "POST", { email });
    setMsg("OTP Sent");
  }

  async function verifyOTP() {
    await api("/api/auth/verify", "POST", { email, otp });
    setMsg("Login Successful");
  }

  async function bookSlot() {
    await api("/api/availability", "POST", {
      doctorId: "doc1",
      day: "Monday",
      slots: [slot],
    });
    setMsg("Slot Booked");
  }

  async function bookAmbulance() {
    const res = await api("/api/ambulance/book", "POST", {
      patientName: "User",
      pickupLocation: "Dhaka",
    });
    setEta(res.eta);
  }

  return (
    <div style={containerStyle}>
      <div>
        <h1 style={{ textAlign: "center", marginBottom: 40, color: "#343a40" }}>
          HealthConnect
        </h1>

        <section style={sectionStyle}>
          <h2>OTP Login</h2>
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button style={btn} onClick={sendOTP}>
            Send OTP
          </button>
          <input
            style={{ ...inputStyle, marginTop: 20 }}
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button style={btn} onClick={verifyOTP}>
            Verify
          </button>
          {msg && (
            <p
              style={{
                marginTop: 15,
                color: "#28a745",
                fontWeight: "600",
              }}
            >
              {msg}
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h2>Doctor Slot</h2>
          <input
            style={inputStyle}
            type="datetime-local"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          />
          <button style={btn} onClick={bookSlot}>
            Book Slot
          </button>
        </section>

        <section style={sectionStyle}>
          <h2>Ambulance</h2>
          <button style={btn} onClick={bookAmbulance}>
            Book Ambulance
          </button>
          {eta && (
            <p style={{ marginTop: 15, fontWeight: "600", color: "#17a2b8" }}>
              Live ETA: {eta} minutes
            </p>
          )}
        </section>

        <section style={sectionStyle}>
          <h2>📄 E-Prescription</h2>
          <button style={btn}>Generate QR</button>
          <button style={btnSecondary}>Download PDF</button>
          <p style={{ marginTop: 10, color: "#6c757d" }}>
            ✔ QR-based verification supported
          </p>
        </section>
      </div>
    </div>
  );
}
