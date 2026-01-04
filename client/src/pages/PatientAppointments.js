/**
 * Patient Appointments Page
 * Shows patient's appointments with incoming video call handling
 */

import { useEffect, useState } from 'react';
import { appointmentsAPI } from '../services/api';
import socketService from '../services/socket';
import VideoCallModal from '../components/VideoCallModal';
import '../PatientAppointment.css';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '', type: 'in-person' });
  const [msg, setMsg] = useState('');

  // Video call state
  const [incomingCall, setIncomingCall] = useState(null); // { appointmentId, doctorId, doctorName }
  const [activeCall, setActiveCall] = useState(null);

  // Load patient's appointments
  const loadAppointments = async () => {
    try {
      const { data } = await appointmentsAPI.mine();
      setAppointments(data.appointments || []);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load appointments');
    }
  };

  // Set up socket listeners on mount
  useEffect(() => {
    // Listen for incoming calls from doctor
    socketService.onIncomingCall(({ appointmentId, doctorId, doctorName }) => {
      console.log('[Patient] Incoming call:', { appointmentId, doctorId, doctorName });
      setIncomingCall({ appointmentId, doctorId, doctorName });
    });

    // Listen for call ended by doctor
    socketService.onCallEnded(() => {
      setActiveCall(null);
      setIncomingCall(null);
      setMsg('Call ended');
    });

    // Listen for appointment status updates (e.g., completed by doctor)
    socketService.onAppointmentUpdated(({ appointmentId, status }) => {
      console.log('[Patient] Appointment updated:', appointmentId, status);
      setMsg(`Appointment marked as ${status} by doctor`);
      loadAppointments(); // Refresh the list
    });

    return () => {
      socketService.off('call:incoming');
      socketService.off('call:ended');
      socketService.off('appointment:updated');
    };
  }, []);

  useEffect(() => {
    loadAppointments();
  }, []);

  // Accept call and signal ready
  const acceptCall = () => {
    if (incomingCall) {
      socketService.confirmReady(incomingCall.appointmentId, incomingCall.doctorId);
      setActiveCall(incomingCall);
      setIncomingCall(null);
    }
  };

  // Decline call
  const declineCall = () => {
    if (incomingCall) {
      socketService.declineCall(incomingCall.appointmentId, incomingCall.doctorId);
      setIncomingCall(null);
    }
  };

  // Close video call
  const closeVideoCall = () => {
    setActiveCall(null);
  };

  // Book new appointment
  const bookAppointment = async () => {
    setMsg('');
    try {
      const { data } = await appointmentsAPI.book(form);
      setMsg(`Appointment ${data.status}`);
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Booking failed');
    }
  };

  // Reschedule existing appointment
  const rescheduleAppointment = async (id) => {
    const newDate = prompt('Enter new date/time (ISO format):', new Date().toISOString());
    if (!newDate) return;
    setMsg('');
    try {
      const { data } = await appointmentsAPI.reschedule(id, { newDate });
      setMsg(`Reschedule ${data.status}`);
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Reschedule failed');
    }
  };

  // Cancel appointment
  const cancelAppointment = async (id) => {
    setMsg('');
    try {
      await appointmentsAPI.cancel(id);
      setMsg('Appointment cancelled');
      await loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Cancel failed');
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
      <h2>My Appointments</h2>

      {/* Booking form */}
      <div className="row">
        <input
          className="input"
          placeholder="Doctor ID"
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
        />
        <input
          className="input"
          type="datetime-local"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <select
          className="input"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="in-person">In-Person</option>
          <option value="online">Online</option>
        </select>
        <button className="btn" onClick={bookAppointment}>Book</button>
      </div>

      {msg && <p className="kicker">{msg}</p>}

      {/* Appointment list */}
      <ul className="appointment-list">
        {appointments.map((a) => (
          <li key={a._id} className="appointment-item">
            <div>
              <strong>Doctor:</strong> {a.doctorId?.name || a.doctorId} <br />
              <strong>Hospital:</strong> {a.hospitalId?.name || 'N/A'} <br />
              <strong>When:</strong> {new Date(a.slotId?.date || a.date).toLocaleString()} <br />
              <strong>Type:</strong> {a.type === 'online' ? 'Online' : 'In-Person'} <br />
              <strong>Status:</strong> {renderStatus(a.status)}
            </div>
            <div className="actions">
              {a.status !== 'cancelled' && a.status !== 'completed' && (
                <>
                  <button className="btn secondary" onClick={() => rescheduleAppointment(a._id)}>Reschedule</button>
                  <button className="btn danger" onClick={() => cancelAppointment(a._id)}>Cancel</button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-modal">
            <div className="call-icon">
              <span className="ring-animation"></span>
              <span className="phone-icon">📞</span>
            </div>
            <h3>Incoming Video Call</h3>
            <p>Dr. {incomingCall.doctorName} is calling...</p>
            <div className="call-actions">
              <button className="btn-accept" onClick={acceptCall}>
                Ready
              </button>
              <button className="btn-decline" onClick={declineCall}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {activeCall && (
        <VideoCallModal
          isOpen={!!activeCall}
          onClose={closeVideoCall}
          appointmentId={activeCall.appointmentId}
          remoteUserId={activeCall.doctorId}
          remoteUserName={`Dr. ${activeCall.doctorName}`}
          isInitiator={false}
        />
      )}
    </div>
  );
}
