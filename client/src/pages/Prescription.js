// src/components/Prescription.js
import React, { useState } from "react";
import { api } from "../api";

export default function Prescription() {
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [medicines, setMedicines] = useState("");
  const [prescription, setPrescription] = useState(null);
  const [msg, setMsg] = useState("");

  async function createPrescription() {
    if (!patientName || !doctorName || !medicines) {
      setMsg("Fill all fields");
      return;
    }

    try {
      const medsArray = medicines.split(",").map((m) => m.trim());
      const presc = await api("/api/prescriptions", "POST", {
        patientName,
        doctorName,
        medicines: medsArray,
      });
      setPrescription(presc);
      setMsg("Prescription created");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  return (
    <div>
      <h2>E-Prescriptions with QR & PDF</h2>
      <input
        placeholder="Patient Name"
        value={patientName}
        onChange={(e) => setPatientName(e.target.value)}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <input
        placeholder="Doctor Name"
        value={doctorName}
        onChange={(e) => setDoctorName(e.target.value)}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <textarea
        placeholder="Medicines (comma separated)"
        value={medicines}
        onChange={(e) => setMedicines(e.target.value)}
        rows={3}
        style={{ width: "250px", marginBottom: 6, padding: 6 }}
      />
      <br />
      <button onClick={createPrescription}>Create Prescription</button>
      <p>{msg}</p>

      {prescription && (
        <div style={{ marginTop: 10 }}>
          <p><strong>Patient:</strong> {prescription.patientName}</p>
          <p><strong>Doctor:</strong> {prescription.doctorName}</p>
          <p><strong>Medicines:</strong> {prescription.medicines.join(", ")}</p>
          <img
            src={prescription.qrCode}
            alt="QR Code"
            style={{ maxWidth: 150, marginBottom: 6 }}
          />
          <br />
          {/* Assuming backend route exists to serve PDF by ID */}
          <a
            href={`http://127.0.0.1:9358/api/prescriptions/pdf/${prescription._id}`}
            target="_blank"
            rel="noreferrer"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
}
