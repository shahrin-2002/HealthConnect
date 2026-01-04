// src/components/DoctorAvailability.js
import React, { useState } from "react";
import { api } from "../api";

export default function DoctorAvailability() {
  const [doctorId, setDoctorId] = useState("");
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [msg, setMsg] = useState("");

  async function saveAvailability() {
    if (!doctorId || !day || !slot) {
      setMsg("Please fill all fields");
      return;
    }
    try {
      await api("/api/availability", "POST", {
        doctorId,
        day,
        slots: [slot],
      });
      setMsg("Availability saved successfully");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  return (
    <div>
      <h2>Doctor Availability Calendar & Slot</h2>
      <input
        placeholder="Doctor ID"
        value={doctorId}
        onChange={(e) => setDoctorId(e.target.value)}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <input
        type="date"
        value={day}
        onChange={(e) => setDay(e.target.value)}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <input
        placeholder="Available Slot (e.g. 10:00-11:00)"
        value={slot}
        onChange={(e) => setSlot(e.target.value)}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <button onClick={saveAvailability}>Save Availability</button>
      <p>{msg}</p>
    </div>
  );
}
