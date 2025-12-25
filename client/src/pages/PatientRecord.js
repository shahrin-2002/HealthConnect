/**
 * Patient Records Page Component
 * Allows a logged-in patient to view their own medical records
 */

import React, { useEffect, useState } from 'react';
import { medicalRecordAPI } from '../services/api';
import '../styles/Search.css'; // reuse styling if you want

const PatientRecord = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch patient's own records
  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await medicalRecordAPI.mine();
      setRecords(response.data.records || []);
    } catch (err) {
      console.error('Error fetching patient records:', err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>My Medical Records</h1>
      </div>

      <div className="search-content">
        {error && <div className="error-message">{error}</div>}
        {loading ? (
          <div className="loading">Loading records...</div>
        ) : (
          <ul className="records-list">
            {records.map((r) => (
              <li key={r._id} className="record-card">
                <h3>Visit on {new Date(r.visitDate).toLocaleDateString()}</h3>
                <p><strong>Reason:</strong> {r.reason}</p>
                <p><strong>Notes:</strong> {r.notes || 'N/A'}</p>

                <p>
                  <strong>Doctor:</strong> {r.doctorId?.name} ({r.doctorId?.specialization})
                </p>
                {r.doctorId?.hospital_id && (
                  <p>
                    <strong>Hospital:</strong> {r.doctorId.hospital_id.name} ({r.doctorId.hospital_id.city})
                  </p>
                )}

                {r.diagnoses?.length > 0 && (
                  <p><strong>Diagnoses:</strong> {r.diagnoses.map(d => d.description).join(', ')}</p>
                )}

                {r.vitals && (
                  <div className="vitals">
                    <strong>Vitals:</strong>
                    <ul>
                      {r.vitals.bloodPressure && <li>Blood Pressure: {r.vitals.bloodPressure}</li>}
                      {r.vitals.heartRate && <li>Heart Rate: {r.vitals.heartRate}</li>}
                      {r.vitals.temperature && <li>Temperature: {r.vitals.temperature} °C</li>}
                      {r.vitals.weight && <li>Weight: {r.vitals.weight} kg</li>}
                      {r.vitals.height && <li>Height: {r.vitals.height} cm</li>}
                    </ul>
                  </div>
                )}

                {r.prescriptions?.length > 0 && (
                  <div className="prescriptions">
                    <strong>Prescriptions:</strong>
                    <ul>
                      {r.prescriptions.map((p, idx) => (
                        <li key={idx}>
                          {p.medication} — {p.dosage}, {p.frequency}, {p.duration}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.attachments?.length > 0 && (
                  <div className="attachments">
                    <strong>Attachments:</strong>
                    <ul>
                      {r.attachments.map((a) => (
                        <li key={a._id}>
                          <a href={a.url} target="_blank" rel="noreferrer">
                            {a.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
            {records.length === 0 && !loading && (
              <div className="no-results">No medical records found</div>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PatientRecord;
