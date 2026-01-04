/**
 * Patient Appointments Page
 * Complete appointment booking with online/in-person selection
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { appointmentsAPI, doctorAPI } from '../services/api';
import socketService from '../services/socket';
import VideoCallModal from '../components/VideoCallModal';
import '../styles/Appointments.css';

export default function PatientAppointments() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Redirect doctors to doctor appointments page
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'doctor') {
      navigate('/doctor/appointments', { replace: true });
    }
  }, [user, navigate]);

  // Booking form state
  const [appointmentType, setAppointmentType] = useState('in-person');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewTab, setViewTab] = useState('upcoming'); // 'upcoming' or 'archived'

  // Reschedule modal state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Video call state
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  // Load doctors and appointments on mount
  useEffect(() => {
    loadDoctors();
    loadAppointments();

    // Setup socket listeners
    socketService.onIncomingCall(({ appointmentId, doctorId, doctorName }) => {
      setIncomingCall({ appointmentId, doctorId, doctorName });
    });

    socketService.onCallEnded(() => {
      setActiveCall(null);
      setIncomingCall(null);
    });

    socketService.onAppointmentUpdated(({ status }) => {
      loadAppointments();
    });

    return () => {
      socketService.off('call:incoming');
      socketService.off('call:ended');
      socketService.off('appointment:updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchSlots(selectedDoctor, selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot('');
    }
  }, [selectedDoctor, selectedDate]);

  // Fetch reschedule slots when date changes
  useEffect(() => {
    if (rescheduleAppointment && rescheduleDate) {
      const doctorId = rescheduleAppointment.doctorId?._id || rescheduleAppointment.doctorId;
      fetchRescheduleSlots(doctorId, rescheduleDate);
    }
  }, [rescheduleDate, rescheduleAppointment]);

  const loadDoctors = async () => {
    try {
      const { data } = await doctorAPI.getAll();
      // API returns data in 'data' property, not 'doctors'
      setDoctors(data.data || data.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    }
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await appointmentsAPI.mine();
      setAppointments(data.appointments || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load appointments' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, date) => {
    try {
      const { data } = await doctorAPI.getSlots(doctorId, date);
      setAvailableSlots(data.slots || []);
      setSelectedSlot('');
    } catch (err) {
      setAvailableSlots([]);
    }
  };

  const fetchRescheduleSlots = async (doctorId, date) => {
    try {
      const { data } = await doctorAPI.getSlots(doctorId, date);
      setRescheduleSlots(data.slots || []);
      setRescheduleSlot('');
    } catch (err) {
      setRescheduleSlots([]);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setMessage({ type: 'error', text: 'Please select doctor, date, and time slot' });
      return;
    }

    setBookingLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Combine date and slot time
      const dateTime = new Date(`${selectedDate}T${selectedSlot}:00`);

      const { data } = await appointmentsAPI.book({
        doctorId: selectedDoctor,
        date: dateTime.toISOString(),
        type: appointmentType,
        notes: notes
      });

      setMessage({
        type: 'success',
        text: data.status === 'waitlisted'
          ? 'Added to waitlist - we\'ll notify you when a slot opens!'
          : 'Appointment booked successfully!'
      });

      // Reset form
      setSelectedDoctor('');
      setDoctorSearch('');
      setSelectedDate('');
      setSelectedSlot('');
      setNotes('');
      setAvailableSlots([]);

      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Booking failed' });
    } finally {
      setBookingLoading(false);
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleAppointment(appointment);
    setRescheduleDate('');
    setRescheduleSlots([]);
    setRescheduleSlot('');
    setShowRescheduleModal(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleSlot) {
      setMessage({ type: 'error', text: 'Please select new date and time' });
      return;
    }

    setRescheduleLoading(true);

    try {
      const newDateTime = new Date(`${rescheduleDate}T${rescheduleSlot}:00`);

      await appointmentsAPI.reschedule(rescheduleAppointment._id, {
        newDate: newDateTime.toISOString()
      });

      setMessage({ type: 'success', text: 'Appointment rescheduled successfully!' });
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Reschedule failed' });
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentsAPI.cancel(appointmentId);
      setMessage({ type: 'success', text: 'Appointment cancelled' });
      await loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Cancel failed' });
    }
  };

  const acceptCall = () => {
    if (incomingCall) {
      socketService.confirmReady(incomingCall.appointmentId, incomingCall.doctorId);
      setActiveCall(incomingCall);
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    if (incomingCall) {
      socketService.declineCall(incomingCall.appointmentId, incomingCall.doctorId);
      setIncomingCall(null);
    }
  };

  const closeVideoCall = () => {
    setActiveCall(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSelectedDoctorInfo = () => {
    return doctors.find(d => d._id === selectedDoctor);
  };

  const getFilteredDoctors = () => {
    if (!doctorSearch.trim()) return doctors;
    const search = doctorSearch.toLowerCase();
    return doctors.filter(doc =>
      doc.name?.toLowerCase().includes(search) ||
      doc.specialization?.toLowerCase().includes(search) ||
      doc.hospital_id?.name?.toLowerCase().includes(search)
    );
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor._id);
    setDoctorSearch(`Dr. ${doctor.name} - ${doctor.specialization}`);
    setShowDoctorDropdown(false);
  };

  const handleDoctorSearchChange = (e) => {
    setDoctorSearch(e.target.value);
    setSelectedDoctor('');
    setShowDoctorDropdown(true);
  };

  const handleDoctorSearchFocus = () => {
    setShowDoctorDropdown(true);
  };

  const handleDoctorSearchBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => setShowDoctorDropdown(false), 200);
  };

  // Filter appointments by upcoming vs archived
  const getFilteredAppointments = () => {
    const typeFiltered = appointments.filter(a => a.type === appointmentType);

    if (viewTab === 'upcoming') {
      // Upcoming: booked, approved, waitlisted, rescheduled
      return typeFiltered.filter(a =>
        ['booked', 'approved', 'waitlisted', 'rescheduled'].includes(a.status)
      );
    } else {
      // Archived: completed, cancelled
      return typeFiltered.filter(a =>
        ['completed', 'cancelled'].includes(a.status)
      );
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
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
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/doctors">Doctors</Link></li>
          <li><Link to="/appointments" className="active">Appointments</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div className="nav-buttons">
          <button className="btn-dark" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Title Section */}
      <div className="appointments-title-section">
        <h2>Book an Appointment</h2>
        <p>Schedule online or in-person consultations with doctors</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Booking Section */}
      <div className="booking-section">
        <h3>&#128197; New Appointment</h3>

        {/* Type Selector */}
        <div className="type-selector">
          <div
            className={`type-card ${appointmentType === 'online' ? 'selected' : ''}`}
            onClick={() => setAppointmentType('online')}
          >
            <span className="type-icon">&#128249;</span>
            <h4>Online Consultation</h4>
            <p>Video call with doctor from home</p>
          </div>
          <div
            className={`type-card ${appointmentType === 'in-person' ? 'selected' : ''}`}
            onClick={() => setAppointmentType('in-person')}
          >
            <span className="type-icon">&#127973;</span>
            <h4>In-Person Visit</h4>
            <p>Visit the hospital for consultation</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="booking-form">
          {/* Doctor Selection with Search */}
          <div className="form-group doctor-search-group">
            <label>Search & Select Doctor *</label>
            <div className="doctor-search-container">
              <input
                type="text"
                placeholder="Search by name, specialization, or hospital..."
                value={doctorSearch}
                onChange={handleDoctorSearchChange}
                onFocus={handleDoctorSearchFocus}
                onBlur={handleDoctorSearchBlur}
                className="doctor-search-input"
              />
              {showDoctorDropdown && (
                <div className="doctor-dropdown">
                  {getFilteredDoctors().length === 0 ? (
                    <div className="doctor-dropdown-empty">No doctors found</div>
                  ) : (
                    getFilteredDoctors().slice(0, 10).map((doc) => (
                      <div
                        key={doc._id}
                        className="doctor-dropdown-item"
                        onClick={() => handleSelectDoctor(doc)}
                      >
                        <div className="doctor-dropdown-avatar">
                          {doc.name?.charAt(0) || 'D'}
                        </div>
                        <div className="doctor-dropdown-info">
                          <div className="doctor-dropdown-name">Dr. {doc.name}</div>
                          <div className="doctor-dropdown-meta">
                            {doc.specialization} | {doc.hospital_id?.name || 'Hospital'} | &#2547;{doc.consultation_fee || 500}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="form-group">
            <label>Select Date *</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getTodayDate()}
            />
          </div>

          {/* Doctor Info Display */}
          {selectedDoctor && getSelectedDoctorInfo() && (
            <div className="form-group full-width">
              <div className="doctor-info-display">
                <div className="avatar">
                  {getSelectedDoctorInfo().name?.charAt(0) || 'D'}
                </div>
                <div className="details">
                  <h4>Dr. {getSelectedDoctorInfo().name}</h4>
                  <p>{getSelectedDoctorInfo().specialization} | {getSelectedDoctorInfo().hospital_id?.name || 'Hospital'}</p>
                </div>
                <div className="fee">
                  &#2547;{getSelectedDoctorInfo().consultation_fee || 500}
                </div>
              </div>
            </div>
          )}

          {/* Time Slots */}
          {selectedDoctor && selectedDate && (
            <div className="form-group full-width slots-section">
              <h4>Available Time Slots</h4>
              {availableSlots.length > 0 ? (
                <div className="slots-grid">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-btn ${selectedSlot === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-slots">
                  No slots available for this date. Please try another date.
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="form-group full-width">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your symptoms or reason for visit..."
            />
          </div>
        </div>

        {/* Book Button */}
        <div className="book-btn-container">
          <button
            className="btn-book"
            onClick={handleBookAppointment}
            disabled={bookingLoading || !selectedDoctor || !selectedDate || !selectedSlot}
          >
            {bookingLoading ? 'Booking...' : `Book ${appointmentType === 'online' ? 'Online' : 'In-Person'} Appointment`}
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="appointments-list-section">
        <div className="section-header">
          <h3>My {appointmentType === 'online' ? 'Online' : 'In-Person'} Appointments</h3>
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
              const doctor = apt.doctorId;
              const canModify = apt.status !== 'cancelled' && apt.status !== 'completed';

              return (
                <div key={apt._id} className="appointment-card">
                  <div className="appointment-card-header">
                    <div className="doctor-avatar">
                      {doctor?.name?.charAt(0) || 'D'}
                    </div>
                    <div className="doctor-details">
                      <h4>Dr. {doctor?.name || 'Doctor'}</h4>
                      <p>{doctor?.specialization || 'Specialist'}</p>
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
                    <div className="info-row">
                      <span>&#128205;</span>
                      {apt.doctorId?.hospital_id?.name || 'Hospital'}
                    </div>
                  </div>

                  <div className="appointment-card-footer">
                    <span className={`status-badge ${apt.status}`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                    <div className="card-actions">
                      {canModify && (
                        <>
                          <button
                            className="btn-secondary"
                            onClick={() => openRescheduleModal(apt)}
                          >
                            Reschedule
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleCancel(apt._id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="doctor-info-display" style={{ marginBottom: '20px' }}>
                <div className="avatar">
                  {rescheduleAppointment.doctorId?.name?.charAt(0) || 'D'}
                </div>
                <div className="details">
                  <h4>Dr. {rescheduleAppointment.doctorId?.name || 'Doctor'}</h4>
                  <p>{rescheduleAppointment.doctorId?.specialization || 'Specialist'}</p>
                </div>
              </div>

              <div className="form-group">
                <label>New Date *</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={getTodayDate()}
                />
              </div>

              {rescheduleDate && (
                <div className="form-group slots-section">
                  <h4>Available Time Slots</h4>
                  {rescheduleSlots.length > 0 ? (
                    <div className="slots-grid">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`slot-btn ${rescheduleSlot === slot ? 'selected' : ''}`}
                          onClick={() => setRescheduleSlot(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="no-slots">
                      No slots available. Try another date.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRescheduleModal(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleReschedule}
                disabled={rescheduleLoading || !rescheduleDate || !rescheduleSlot}
              >
                {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-modal">
            <div className="call-icon">
              <span className="ring-animation"></span>
              <span className="phone-icon">&#128222;</span>
            </div>
            <h3>Incoming Video Call</h3>
            <p>Dr. {incomingCall.doctorName} is calling...</p>
            <div className="call-actions">
              <button className="btn-accept" onClick={acceptCall}>
                Accept
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
