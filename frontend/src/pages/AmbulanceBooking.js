// src/components/AmbulanceBooking.js
import React, { useState } from "react";
import { api } from "../api";

export default function AmbulanceBooking() {
  const [eta, setEta] = useState(null);
  const [msg, setMsg] = useState("");

  async function bookAmbulance() {
    try {
      // Example booking details; update as needed
      const booking = await api("/api/ambulance", "POST", {
        patientName: "John Doe",
        pickupLocation: "123 Main St",
      });
      setMsg("Ambulance booked successfully");
      // Backend currently does not send ETA, so we'll mock it:
      setEta("8"); // 8 minutes ETA for demo
    } catch (e) {
      setMsg("Error booking ambulance: " + e.message);
      setEta(null);
    }
  }

  return (
    <div>
      <h2>Ambulance Booking with Live ETA</h2>
      <button onClick={bookAmbulance}>Book Ambulance</button>
      <p>{msg}</p>
      {eta && <p>Live ETA: {eta} minutes</p>}
    </div>
  );
}
