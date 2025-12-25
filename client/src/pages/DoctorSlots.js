import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../PatientAppointment.css';

export default function DoctorSlots() {
  const { user } = useAuth(); // doctor user
  const [appointments, setAppointments] = useState([]);
  const [msg, setMsg] = useState('');

  // Load doctor's appointments
  const loadAppointments = async () => {
    try {
      // Use doctorId (Doctor model ID) not user._id (User model ID)
      const doctorId = user.doctorId || user._id;
      const { data } = await appointmentsAPI.doctor(doctorId);
      setAppointments(data.appointments || []);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load doctor appointments');
    }
  };

  useEffect(() => {
    if (user?.doctorId || user?._id) loadAppointments();
  }, [user]);

  // Approve appointment
  const approveAppointment = async (id) => {
    setMsg('');
    try {
      await appointmentsAPI.approve(id);
      setMsg('Appointment approved');
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Approval failed');
    }
  };

  // Mark appointment as completed
  const completeAppointment = async (id) => {
    setMsg('');
    try {
      await appointmentsAPI.complete(id);
      setMsg('Appointment marked as completed');
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Completion failed');
    }
  };

  const renderStatus = (status) => {
    if (status === 'waitlisted') return <span className="badge waitlisted">Waitlisted</span>;
    if (status === 'booked') return <span className="badge booked">Booked</span>;
    if (status === 'approved') return <span className="badge approved">Approved</span>;
    if (status === 'cancelled') return <span className="badge cancelled">Cancelled</span>;
    if (status === 'completed') return <span className="badge completed">Completed</span>;
    return <span className="badge">{status}</span>;
  };

  return (
    <div className="card">
      <h2>My Appointments (Doctor)</h2>
      {msg && <p className="kicker">{msg}</p>}

      {/* Appointment list */}
      <ul className="appointment-list">
        {appointments.map((a) => (
          <li key={a._id} className="appointment-item">
            <div>
              <strong>Patient:</strong> {a.patientId?.name || 'Unknown'} <br />
              <strong>Email:</strong> {a.patientId?.email || 'N/A'} <br />
              <strong>When:</strong> {new Date(a.slotId?.date || a.date).toLocaleString()} <br />
              <strong>Type:</strong> {a.type === 'online' ? 'Online' : 'In-Person'} <br />
              <strong>Status:</strong> {renderStatus(a.status)}
            </div>
            <div className="actions">
              {a.status === 'booked' && (
                <button className="btn" onClick={() => approveAppointment(a._id)}>
                  Approve
                </button>
              )}
              {a.status === 'approved' && (
                <button className="btn secondary" onClick={() => completeAppointment(a._id)}>
                  Mark Complete
                </button>
              )}
            </div>
          </li>
        ))}
        {appointments.length === 0 && (
          <li className="appointment-item">
            <p>No appointments found</p>
          </li>
        )}
      </ul>
    </div>
  );
}
