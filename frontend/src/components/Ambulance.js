import { useState } from "react";
import { api } from "../api";

export default function AmbulanceBooking() {
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(false);

  const bookAmbulance = async () => {
    setLoading(true);
    const res = await api("/api/ambulance/book", "POST", {
      patientName: "User",
      pickupLocation: "Dhaka"
    });
    setEta(res.eta);
    setLoading(false);
  };

  return (
    <div style={card}>
      <h3>🚑 Ambulance Booking</h3>
      <button style={btn} onClick={bookAmbulance}>
        {loading ? "Booking..." : "Book Ambulance"}
      </button>
      {eta && <p style={info}>Live ETA: {eta} minutes</p>}
    </div>
  );
}

const card = { padding: 20, border: "1px solid #ddd", borderRadius: 10 };
const btn = { padding: "10px 16px", background: "#e63946", color: "#fff", border: 0, borderRadius: 6 };
const info = { marginTop: 10, fontWeight: "bold" };
