import { useState } from "react";
import { api } from "../api";

export default function DoctorSlots() {
  const [slot, setSlot] = useState("");
  const [msg, setMsg] = useState("");

  const bookSlot = async () => {
    await api("/api/availability", "POST", {
      doctorId: "doc1",
      day: "Monday",
      slots: [slot]
    });
    setMsg("✅ Slot booked successfully");
  };

  return (
    <div style={card}>
      <h3>🩺 Doctor Availability</h3>
      <input type="datetime-local" value={slot} onChange={e => setSlot(e.target.value)} />
      <br /><br />
      <button style={btn} onClick={bookSlot}>Book Slot</button>
      <p>{msg}</p>
    </div>
  );
}

const card = { padding: 20, border: "1px solid #ddd", borderRadius: 10 };
const btn = { padding: "8px 14px", background: "#457b9d", color: "#fff", border: 0, borderRadius: 6 };
