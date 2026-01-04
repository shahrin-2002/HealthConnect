/**
 * Doctor Search Page Component
 * Updated with Member-2 Feature: Real-time Slot Availability
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentsAPI } from '../services/api';
import '../styles/Search.css';

const DoctorSearch = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // ✅ Member-2 New State: Availability Logic
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [appointmentType, setAppointmentType] = useState('in-person');

  // Fetch doctors
  const fetchDoctors = async (search = '') => {
    setLoading(true);
    setError('');
    try {
      const params = { limit, offset };
      if (search) params.search = search;

      const response = await doctorAPI.getAll(params);
      const data = response.data.data || response.data.doctors || [];
      setDoctors(data);
      setTotal(response.data.total || data.length);

      // Auto-select first doctor from search results
      if (data.length > 0) {
        handleSelectDoctor(data[0]);
      } else {
        // Clear selection if no results
        setSelectedDoctor(null);
      }
    } catch (err) {
      setError('Failed to load doctors');
      console.error('Fetch doctors error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctor details
  const fetchDoctorDetails = async (id) => {
    try {
      const response = await doctorAPI.getById(id);
      setSelectedDoctor(response.data.data || response.data.doctor || response.data);
    } catch (err) {
      console.error('Fetch doctor details error:', err);
    }
  };

  // ✅ Member-2 Feature: Fetch Slots for Selected Date
  const fetchSlots = async (date) => {
    if (!selectedDoctor || !date) return;
    setLoadingSlots(true);
    try {
      const id = selectedDoctor._id || selectedDoctor.id;
      const response = await doctorAPI.getSlots(id, date);
      setAvailableSlots(response.data.slots);
    } catch (err) {
      console.error("Error fetching slots", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ✅ Member-2 Feature: Handle Date Selection
  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    fetchSlots(date);
  };

  // Initial load
  useEffect(() => {
    fetchDoctors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchDoctors(searchQuery);
  };

  // Handle doctor selection
  const handleSelectDoctor = (doctor) => {
    // Reset slot state when switching doctors
    setSelectedDate('');
    setAvailableSlots([]);
    fetchDoctorDetails(doctor._id || doctor.id);
  };
  // ✅ Booking handler
  const handleSlotClick = async (slot) => {
    try {
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      // Combine selected date with slot time to create full datetime
      const fullDateTime = `${selectedDate}T${slot}:00`;
      await appointmentsAPI.book({ doctorId, date: fullDateTime, type: appointmentType });
      const typeLabel = appointmentType === 'online' ? 'ONLINE VIDEO CALL' : 'IN-PERSON';
      alert(`YOUR ${typeLabel} APPOINTMENT IS BOOKED`);
      navigate('/appointments');
    } catch (err) {
      alert(err.response?.data?.error || 'Booking failed');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="search-container">
      {/* Header */}
      <div className="search-header">
        <button className="hamburger-menu">☰</button>
        <h1>HealthConnect</h1>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className="search-nav">
        <div className="nav-logo">
          <span>🏥</span>
        </div>
        <ul className="nav-links">
          <li><Link to="/hospitals">Hospitals</Link></li>
          <li><Link to="/doctors" className="active">Doctors</Link></li>
          <li className="nav-dropdown">
            <span className="nav-dropdown-toggle">
              Booking <span className="dropdown-arrow">▼</span>
            </span>
            <ul className="nav-dropdown-menu">
              <li><Link to="/booking/icu">ICU</Link></li>
              <li><Link to="/booking/general-bed">General Bed</Link></li>
              <li><Link to="/booking/cabin">Cabin</Link></li>
            </ul>
          </li>
          <li><Link to="/appointments">Appointments</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
        <div className="nav-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <button className="btn-outline">Dashboard</button>
              </Link>
              <button className="btn-dark" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-outline">Sign in</button>
              </Link>
              <Link to="/register">
                <button className="btn-dark">Register</button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Search Bar */}
      <div className="search-bar-container">
        <form onSubmit={handleSearch} className="search-form">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Find a Doctor"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-mic">🎤</button>
        </form>
      </div>

      {/* Main Content */}
      <div className="search-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading doctors...</div>
        ) : (
          <>
            {/* Doctor List (Left Side) */}
            <div className="search-list">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id || doctor.id}
                  className={`list-item ${(selectedDoctor?._id || selectedDoctor?.id) === (doctor._id || doctor.id) ? 'active' : ''}`}
                  onClick={() => handleSelectDoctor(doctor)}
                >
                  <div className="list-item-image">
                    <span className="placeholder-icon">👨‍⚕️</span>
                  </div>
                  <div className="list-item-info">
                    <h4>{doctor.name}</h4>
                    <p>{doctor.specialization}</p>
                    <span className="availability-tag" data-status={doctor.availability_status}>
                      {doctor.availability_status || 'Available'}
                    </span>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && !loading && (
                <div className="no-results">No doctors found</div>
              )}
            </div>

            {/* Doctor Details (Right Side) */}
            {selectedDoctor && (
              <div className="search-details">
                <div className="details-card">
                  <div className="details-image">
                    <button className="favorite-btn">♡</button>
                    <div className="image-placeholder doctor">
                      <span>👨‍⚕️</span>
                    </div>
                  </div>

                  <div className="details-info">
                    <h2>Dr. {selectedDoctor.name}</h2>
                    <p className="doctor-specialization">{selectedDoctor.specialization}</p>

                    <div className="price-badge">
                      <span className="badge-label">Visiting Fee</span>
                      <div className="price-value">
                        <span className="currency">taka</span>
                        <span className="amount">{selectedDoctor.consultation_fee || 500}</span>
                      </div>
                    </div>

                    <p className="details-instruction">
                      Please select a date and time to see availability.
                    </p>

                    {/* ✅ Member-2 Feature: Dynamic Booking Form */}
                    <div className="booking-form">
                      {/* Appointment Type Selection */}
                      <div className="form-field full-width" style={{ marginBottom: '15px' }}>
                        <label>Appointment Type</label>
                        <select
                          className="form-select"
                          value={appointmentType}
                          onChange={(e) => setAppointmentType(e.target.value)}
                          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', width: '100%' }}
                        >
                          <option value="in-person">In-Person Visit</option>
                          <option value="online">Online Video Call</option>
                        </select>
                      </div>

                      <div className="form-field full-width">
                        <label>Select Date</label>
                        <input
                          type="date"
                          className="form-select"
                          min={new Date().toISOString().split('T')[0]}
                          value={selectedDate}
                          onChange={handleDateChange}
                        />
                      </div>

                      {/* Slots Display Section */}
                      {selectedDate && (
                        <div className="slots-container" style={{ marginTop: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2B2B2B' }}>
                            Available Time Slots
                          </label>
                          
                          {loadingSlots ? (
                            <div style={{ color: '#666', fontSize: '0.9rem', padding: '10px' }}>
                              Checking doctor's schedule...
                            </div>
                          ) : availableSlots.length > 0 ? (
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(3, 1fr)', 
                              gap: '10px',
                              maxHeight: '200px',
                              overflowY: 'auto'
                            }}>
                              {availableSlots.map((slot) => (
                                <button 
                                  key={slot}
                                  className="btn-outline"
                                  style={{ 
                                    padding: '8px', 
                                    fontSize: '0.85rem', 
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    textAlign: 'center'
                                  }}
                                  onClick={() => handleSlotClick(slot)}

                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '5px' }}>
                              No slots available for this date.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Only show 'Book Appointment' if a slot logic was fully implemented (Member-3) */}
                      {!selectedDate && (
                        <button className="btn-booking" disabled style={{ opacity: 0.5, marginTop: '15px' }}>
                          Select Date First
                        </button>
                      )}
                    </div>

                    <div className="about-section">
                      <div className="about-header">
                        <span>About</span>
                        <span className="about-toggle">▲</span>
                      </div>
                      <p>
                        Dr. {selectedDoctor.name} is a {selectedDoctor.specialization} specialist.
                        {selectedDoctor.qualifications && ` ${selectedDoctor.qualifications}.`}
                        {selectedDoctor.hospital_name && ` Currently practicing at ${selectedDoctor.hospital_name}.`}
                        {selectedDoctor.experience_years > 0 && ` With ${selectedDoctor.experience_years} years of experience.`}
                      </p>
                      {selectedDoctor.license_number && (
                        <p><strong>License:</strong> {selectedDoctor.license_number}</p>
                      )}
                      {selectedDoctor.hospital_name && (
                        <p><strong>Hospital:</strong> {selectedDoctor.hospital_name}</p>
                      )}
                      {selectedDoctor.phone && (
                        <p><strong>Phone:</strong> {selectedDoctor.phone}</p>
                      )}
                      {selectedDoctor.email && (
                        <p><strong>Email:</strong> {selectedDoctor.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3>Latest reviews</h3>
        <div className="reviews-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="review-card">
              <div className="review-stars">★★★★★</div>
              <h4 className="review-title">Excellent Doctor</h4>
              <p className="review-body">Very professional and caring physician.</p>
              <div className="reviewer-info">
                <div className="reviewer-avatar">👤</div>
                <div>
                  <p className="reviewer-name">Patient {i}</p>
                  <p className="reviewer-date">Dec 2024</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="newsletter-section">
        <h3>Follow the latest trends</h3>
        <p>With our daily newsletter</p>
        <div className="newsletter-form">
          <input type="email" placeholder="you@example.com" />
          <button className="btn-submit-newsletter">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSearch;
