/**
 * Doctor Online Appointments Page
 * Shows list of online appointments with video call functionality
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorAPI } from '../services/api';
import socketService from '../services/socket';
import VideoCallModal from '../components/VideoCallModal';
import '../styles/Appointments.css';

export default function DoctorOnlineAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewTab, setViewTab] = useState('upcoming');
  const [highlightedId, setHighlightedId] = useState(null);

  // Refs for scrolling
  const appointmentRefs = useRef({});

  // Video call state
  const [callStates, setCallStates] = useState({});
  const [activeCall, setActiveCall] = useState(null);

  // Load online appointments
  const loadAppointments = useCallback(async () => {
    try {
      let doctorId = user?.doctorId;

      if (!doctorId) {
        try {
          const profileRes = await doctorAPI.getMyProfile();
          doctorId = profileRes.data?._id;
        } catch {
          // Profile fetch failed
        }
      }

      if (!doctorId) {
        setMessage({ type: 'error', text: 'Doctor profile not found' });
        setLoading(false);
        return;
      }

      const { data } = await appointmentsAPI.doctor(doctorId);
      const onlineAppts = (data.appointments || []).filter(a => a.type === 'online');
      setAppointments(onlineAppts);

      const states = {};
      onlineAppts.forEach(a => {
        states[a._id] = callStates[a._id] || 'idle';
      });
      setCallStates(states);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  }, [user, callStates]);

  // Socket listeners
  useEffect(() => {
    socketService.onPatientReady(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'ready' }));
      setMessage({ type: 'success', text: 'Patient is ready for the call!' });
    });

    socketService.onCallDeclined(({ appointmentId }) => {
      setCallStates(prev => ({ ...prev, [appointmentId]: 'idle' }));
      setMessage({ type: 'error', text: 'Patient declined the call' });
    });

    socketService.onCallError(({ message }) => {
      setMessage({ type: 'error', text: message });
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

  // Handle scroll to specific appointment from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const scrollToId = params.get('id');

    if (scrollToId && !loading && appointments.length > 0) {
      // Find the appointment and determine if it's in upcoming or archived
      const apt = appointments.find(a => a._id === scrollToId);
      if (apt) {
        const isArchived = ['completed', 'cancelled'].includes(apt.status);
        if (isArchived && viewTab !== 'archived') {
          setViewTab('archived');
        } else if (!isArchived && viewTab !== 'upcoming') {
          setViewTab('upcoming');
        }

        // Scroll after a small delay to ensure DOM is ready
        setTimeout(() => {
          const element = appointmentRefs.current[scrollToId];
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedId(scrollToId);
            // Remove highlight after animation
            setTimeout(() => setHighlightedId(null), 2000);
          }
        }, 100);
      }
    }
  }, [location.search, loading, appointments, viewTab]);

  // Filter appointments
  const getFilteredAppointments = () => {
    if (viewTab === 'upcoming') {
      return appointments.filter(a =>
        ['booked', 'approved', 'waitlisted', 'rescheduled'].includes(a.status)
      );
    } else {
      return appointments.filter(a =>
        ['completed', 'cancelled'].includes(a.status)
      );
    }
  };

  const initiateCall = (appointment) => {
    socketService.initiateCall(appointment._id);
    setCallStates(prev => ({ ...prev, [appointment._id]: 'waiting' }));
    setMessage({ type: 'info', text: 'Calling patient... waiting for response' });
  };

  const cancelWaiting = (appointmentId) => {
    setCallStates(prev => ({ ...prev, [appointmentId]: 'idle' }));
    setMessage({ type: '', text: '' });
  };

  const startVideoCall = (appointment) => {
    setActiveCall({
      appointmentId: appointment._id,
      patientId: appointment.patientId?._id || appointment.patientId,
      patientName: appointment.patientId?.name || 'Patient'
    });
  };

  const closeVideoCall = () => {
    if (activeCall) {
      setCallStates(prev => ({ ...prev, [activeCall.appointmentId]: 'idle' }));
    }
    setActiveCall(null);
    setMessage({ type: '', text: '' });
  };

  const markCompleted = async (appointment) => {
    try {
      await appointmentsAPI.complete(appointment._id);
      const patientId = appointment.patientId?._id || appointment.patientId;
      socketService.notifyAppointmentUpdate(appointment._id, patientId, 'completed');
      setMessage({ type: 'success', text: 'Appointment marked as completed' });
      loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
    }
  };

  const handleApprove = async (id) => {
    try {
      await appointmentsAPI.approve(id);
      setMessage({ type: 'success', text: 'Appointment approved!' });
      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Approval failed' });
    }
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
          <li><Link to="/doctor/appointments">My Appointments</Link></li>
          <li><Link to="/doctor/online-appointments" className="active">Online Calls</Link></li>
          <li><Link to="/doctor/schedule">Manage Schedule</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-dark" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Title Section */}
      <div className="appointments-title-section">
        <h2>&#128249; Online Consultations</h2>
        <p>Manage your video call appointments with patients</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Appointments List */}
      <div className="appointments-list-section">
        <div className="section-header">
          <h3>Online Appointments</h3>
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
            <span>&#128249;</span>
            <p>No {viewTab} online appointments.</p>
          </div>
        ) : (
          <div className="appointments-grid">
            {getFilteredAppointments().map((apt) => {
              const patient = apt.patientId;
              const callState = callStates[apt._id] || 'idle';
              const canApprove = apt.status === 'booked';
              const canCall = apt.status === 'approved';
              const isHighlighted = highlightedId === apt._id;

              return (
                <div
                  key={apt._id}
                  ref={el => appointmentRefs.current[apt._id] = el}
                  className={`appointment-card ${isHighlighted ? 'highlighted' : ''}`}
                >
                  <div className="appointment-card-header">
                    <div className="doctor-avatar">
                      {patient?.name?.charAt(0) || 'P'}
                    </div>
                    <div className="doctor-details">
                      <h4>{patient?.name || 'Patient'}</h4>
                      <p>{patient?.email || 'No email'}</p>
                    </div>
                    <span className="type-badge online">
                      &#128249; Online
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
                    <div className="card-actions">
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
                          className="btn-book btn-call"
                          onClick={() => initiateCall(apt)}
                        >
                          &#128222; Start Call
                        </button>
                      )}
                      {canCall && callState === 'waiting' && (
                        <div className="call-waiting">
                          <span className="waiting-dots">
                            <span></span><span></span><span></span>
                          </span>
                          <button
                            className="btn-secondary btn-small"
                            onClick={() => cancelWaiting(apt._id)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {canCall && callState === 'ready' && (
                        <button
                          className="btn-book btn-join"
                          onClick={() => startVideoCall(apt)}
                        >
                          &#127909; Join Call
                        </button>
                      )}
                      {canCall && (
                        <button
                          className="btn-secondary"
                          onClick={() => markCompleted(apt)}
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
