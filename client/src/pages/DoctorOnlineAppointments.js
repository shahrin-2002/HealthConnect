/**
 * Doctor Online Appointments Page
 * Shows list of online appointments with video call functionality
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorAPI } from '../services/api';
import socketService from '../services/socket';
import VideoCallModal from '../components/VideoCallModal';
import './DoctorOnlineAppointments.css';

export default function DoctorOnlineAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Video call state
  const [callStates, setCallStates] = useState({}); // { appointmentId: 'idle' | 'waiting' | 'ready' }
  const [activeCall, setActiveCall] = useState(null); // { appointmentId, patientId, patientName }

  // Load online appointments
  const loadAppointments = useCallback(async () => {
    try {
      let doctorId = user?.doctorId;

      // If doctorId not in user object, fetch from doctor profile API
      if (!doctorId) {
        try {
          const profileRes = await doctorAPI.getMyProfile();
          doctorId = profileRes.data?._id;
        } catch {
          // Profile fetch failed
        }
      }

      if (!doctorId) {
        setMsg('Doctor profile not found');
        setLoading(false);
        return;
      }

      // Get doctor's appointments and filter for online type
      const { data } = await appointmentsAPI.doctor(doctorId);
      const onlineAppts = (data.appointments || []).filter(a => a.type === 'online');
      setAppointments(onlineAppts);

      // Initialize call states for all appointments
      const states = {};
      onlineAppts.forEach(a => {
        states[a._id] = callStates[a._id] || 'idle';
      });
      setCallStates(states);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [user, callStates]);

  // Set up socket listeners on mount
  useEffect(() => {
    // Listen for patient ready
    socketService.onPatientReady(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'ready' }));
      setMsg('Patient is ready for the call!');
    });

    // Listen for patient decline
    socketService.onCallDeclined(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'idle' }));
      setMsg('Patient declined the call');
    });

    // Listen for call errors
    socketService.onCallError(({ message }) => {
      setMsg(message);
      // Reset all waiting states to idle
      setCallStates(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key] === 'waiting') updated[key] = 'idle';
        });
        return updated;
      });
    });

    return () => {
      socketService.off('call:patient-ready');
      socketService.off('call:declined');
      socketService.off('call:error');
    };
  }, []);

  // Load appointments on mount
  useEffect(() => {
    if (user) {
      loadAppointments();
    } else {
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initiate call to patient
  const initiateCall = (appointment) => {
    const patientId = appointment.patientId?._id || appointment.patientId;
    socketService.initiateCall(appointment._id, patientId);
    setCallStates(prev => ({ ...prev, [appointment._id]: 'waiting' }));
    setMsg('Calling patient... waiting for response');
  };

  // Cancel waiting for patient
  const cancelWaiting = (appointmentId) => {
    setCallStates(prev => ({ ...prev, [appointmentId]: 'idle' }));
    setMsg('');
  };

  // Start video call (when patient is ready)
  const startVideoCall = (appointment) => {
    setActiveCall({
      appointmentId: appointment._id,
      patientId: appointment.patientId?._id || appointment.patientId,
      patientName: appointment.patientId?.name || 'Patient'
    });
  };

  // Close video call
  const closeVideoCall = () => {
    if (activeCall) {
      setCallStates(prev => ({ ...prev, [activeCall.appointmentId]: 'idle' }));
    }
    setActiveCall(null);
    setMsg('');
  };

  // Mark appointment as completed
  const markCompleted = async (appointment) => {
    try {
      await appointmentsAPI.complete(appointment._id);
      // Notify patient in real-time
      const patientId = appointment.patientId?._id || appointment.patientId;
      socketService.notifyAppointmentUpdate(appointment._id, patientId, 'completed');
      setMsg('Appointment marked as completed');
      loadAppointments();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="online-appointments-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="online-appointments-container">
      <div className="page-header">
        <h1>Online Appointments</h1>
        <p>View and manage your online video appointments</p>
      </div>

      {msg && <div className="message">{msg}</div>}

      {appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Online Appointments</h3>
          <p>You don't have any online appointments scheduled yet.</p>
        </div>
      ) : (
        <div className="appointments-grid">
          {appointments.map((appt) => (
            <div key={appt._id} className="appointment-card">
              <div className="patient-info">
                <div className="patient-avatar">
                  {appt.patientId?.name?.charAt(0) || '?'}
                </div>
                <div className="patient-details">
                  <h3>{appt.patientId?.name || 'Unknown Patient'}</h3>
                  <p>{appt.patientId?.email}</p>
                </div>
              </div>

              <div className="appointment-meta">
                <div className="meta-item">
                  <span className="meta-label">Scheduled</span>
                  <span className="meta-value">
                    {new Date(appt.slotId?.date || appt.date).toLocaleString()}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`status-badge ${appt.status}`}>{appt.status}</span>
                </div>
              </div>

              {/* Video Call Actions */}
              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                <div className="appointment-actions">
                  {/* Idle state - Show Start Call button */}
                  {(!callStates[appt._id] || callStates[appt._id] === 'idle') && (
                    <button
                      className="btn-start-call"
                      onClick={() => initiateCall(appt)}
                    >
                      Start Call
                    </button>
                  )}

                  {/* Waiting state - Show waiting indicator */}
                  {callStates[appt._id] === 'waiting' && (
                    <div className="waiting-state">
                      <div className="waiting-indicator">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                      <span>Waiting for patient...</span>
                      <button
                        className="btn-cancel-waiting"
                        onClick={() => cancelWaiting(appt._id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Ready state - Show Join Call button */}
                  {callStates[appt._id] === 'ready' && (
                    <button
                      className="btn-join-call"
                      onClick={() => startVideoCall(appt)}
                    >
                      Patient Ready - Join Call
                    </button>
                  )}

                  {/* Mark as completed button */}
                  <button
                    className="btn-complete"
                    onClick={() => markCompleted(appt)}
                  >
                    Mark as Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Video Call Modal */}
      {activeCall && (
        <VideoCallModal
          isOpen={!!activeCall}
          onClose={closeVideoCall}
          appointmentId={activeCall.appointmentId}
          remoteUserId={activeCall.patientId}
          remoteUserName={activeCall.patientName}
          isInitiator={true}
        />
      )}
    </div>
  );
}
