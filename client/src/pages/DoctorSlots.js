/**
 * Doctor Appointments Page
 * Shows doctor's appointments with filtering and actions
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorAPI } from '../services/api';
import socketService from '../services/socket';
import VideoCallModal from '../components/VideoCallModal';
import '../styles/Appointments.css';

export default function DoctorSlots() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // State
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [viewTab, setViewTab] = useState('upcoming');

  // Video call state
  const [activeCall, setActiveCall] = useState(null);
  const [callStates, setCallStates] = useState({}); // { appointmentId: 'idle' | 'waiting' | 'ready' }

  // Load appointments on mount
  useEffect(() => {
    loadAppointments();

    // Socket listeners for video calls
    socketService.onPatientReady(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'ready' }));
    });

    socketService.onCallDeclined(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'idle' }));
      setMessage({ type: 'error', text: 'Patient declined the call' });
    });

    socketService.onCallEnded(() => {
      setActiveCall(null);
      setCallStates({});
    });

    return () => {
      socketService.off('call:patient-ready');
      socketService.off('call:declined');
      socketService.off('call:ended');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let doctorId = user?.doctorId;

      // If doctorId not in user object, fetch from doctor profile API
      if (!doctorId) {
        try {
          const profileRes = await doctorAPI.getMyProfile();
          doctorId = profileRes.data?._id;
        } catch {
          // Profile fetch failed, doctor might not be set up
        }
      }

      if (!doctorId) {
        setMessage({ type: 'error', text: 'Doctor profile not found. Please contact support.' });
        setLoading(false);
        return;
      }

      const { data } = await appointmentsAPI.doctor(doctorId);
      setAppointments(data.appointments || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  };

  // Filter appointments
  const getFilteredAppointments = () => {
    const typeFiltered = appointments.filter(a => a.type === appointmentType);

    if (viewTab === 'upcoming') {
      return typeFiltered.filter(a =>
        ['booked', 'approved', 'waitlisted', 'rescheduled'].includes(a.status)
      );
    } else {
      return typeFiltered.filter(a =>
        ['completed', 'cancelled'].includes(a.status)
      );
    }
  };

  // Approve appointment
  const handleApprove = async (id) => {
    try {
      await appointmentsAPI.approve(id);
      setMessage({ type: 'success', text: 'Appointment approved!' });
      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
  };

  // Mark as completed
  const handleComplete = async (id) => {
    try {
      await appointmentsAPI.complete(id);
      setMessage({ type: 'success', text: 'Appointment marked as completed!' });
      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Completion failed' });
    }
  };

  // Initiate video call
  const initiateCall = (appointment) => {
    const patientId = appointment.patientId?._id || appointment.patientId;
    socketService.initiateCall(appointment._id, patientId);
    setCallStates(prev => ({ ...prev, [appointment._id]: 'waiting' }));
  };

  // Join video call
  const joinCall = (appointment) => {
    setActiveCall({
      appointmentId: appointment._id,
      patientId: appointment.patientId?._id || appointment.patientId,
      patientName: appointment.patientId?.name || 'Patient'
    });
  };

  // Close video call
  const closeVideoCall = () => {
    setActiveCall(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="appointments-container">
      {/* Header */}
      <div className="appointments-header">
        <button className="hamburger-menu">&#9776;</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="appointments-nav">
        <div className="nav-logo">
          <span>&#127973;</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/doctor/appointments" className="active">My Appointments</Link></li>
          <li><Link to="/doctor/online-appointments">Online Calls</Link></li>
          <li><Link to="/doctor/schedule">Manage Schedule</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-dark" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Title Section */}
      <div className="appointments-title-section">
        <h2>My Appointments</h2>
        <p>View and manage your patient appointments</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-section">
        <div className="filter-tabs">
          <button
            className={`filter-btn ${appointmentType === 'in-person' ? 'active' : ''}`}
            onClick={() => setAppointmentType('in-person')}
          >
            &#127973; In-Person
          </button>
          <button
            className={`filter-btn ${appointmentType === 'online' ? 'active' : ''}`}
            onClick={() => setAppointmentType('online')}
          >
            &#128249; Online
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="appointments-list-section">
        <div className="section-header">
          <h3>{appointmentType === 'online' ? 'Online' : 'In-Person'} Appointments</h3>
          <div className="view-tabs">
            <button
              className={`tab-btn ${viewTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setViewTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`tab-btn ${viewTab === 'archived' ? 'active' : ''}`}
              onClick={() => setViewTab('archived')}
            >
              Archived
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading appointments...</div>
        ) : getFilteredAppointments().length === 0 ? (
          <div className="no-appointments">
            <span>&#128197;</span>
            <p>No {viewTab} {appointmentType} appointments.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {getFilteredAppointments().map((apt) => {
              const patient = apt.patientId;
              const callState = callStates[apt._id] || 'idle';
              const canApprove = apt.status === 'booked';
              const canComplete = apt.status === 'approved';
              const canCall = apt.type === 'online' && apt.status === 'approved';

              const handleCardClick = () => {
                if (apt.type === 'online') {
                  navigate(`/doctor/online-appointments?id=${apt._id}`);
                }
              };

              return (
                <div
                  key={apt._id}
                  className={`appointment-card ${apt.type === 'online' ? 'clickable' : ''}`}
                  onClick={apt.type === 'online' ? handleCardClick : undefined}
                  style={apt.type === 'online' ? { cursor: 'pointer' } : {}}
                >
                  <div className="appointment-card-header">
                    <div className="doctor-avatar">
                      {patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="doctor-details">
                      <h4>{patient?.name || 'Patient'}</h4>
                      <p>{patient?.email || 'No email'}</p>
                    </div>
                    <span className={`type-badge ${apt.type}`}>
                      {apt.type === 'online' ? '&#128249; Online' : '&#127973; In-Person'}
                    </span>
                  </div>

                  <div className="appointment-card-body">
                    <div className="info-row">
                      <span>&#128197;</span>
                      {formatDate(apt.date)}
                    </div>
                    <div className="info-row">
                      <span>&#128336;</span>
                      {formatTime(apt.date)}
                    </div>
                    {apt.notes && (
                      <div className="info-row">
                        <span>&#128221;</span>
                        {apt.notes}
                      </div>
                    )}
                  </div>

                  <div className="appointment-card-footer">
                    <span className={`status-badge ${apt.status}`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                    <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                      {canApprove && (
                        <button
                          className="btn-book"
                          onClick={() => handleApprove(apt._id)}
                        >
                          Approve
                        </button>
                      )}
                      {canCall && callState === 'idle' && (
                        <button
                          className="btn-book"
                          onClick={() => initiateCall(apt)}
                        >
                          Start Call
                        </button>
                      )}
                      {canCall && callState === 'waiting' && (
                        <button className="btn-secondary" disabled>
                          Waiting...
                        </button>
                      )}
                      {canCall && callState === 'ready' && (
                        <button
                          className="btn-book"
                          onClick={() => joinCall(apt)}
                          style={{ background: '#28a745' }}
                        >
                          Join Call
                        </button>
                      )}
                      {canComplete && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleComplete(apt._id)}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
